import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/validation";
import { HL_API_URL } from "@/lib/constants";

const TEN_MINUTES_MS = 10 * 60 * 1000;

// In-memory rate limiter (per IP, 30 req/min)
const rateMap = new Map();
const RATE_WINDOW = 60_000;
const RATE_MAX = 30;

/** JSON line: PM2 / systemd often render console object args as `[Object]` past depth 2. */
function verifyLog(label, payload) {
  console.info(`[verify-hl-payment] ${label} ${JSON.stringify(payload)}`);
}

function shortenAddr(a) {
  if (!a || typeof a !== "string" || a.length < 12) return a || "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Readable breakdown so hex logs are interpretable without diffing JSON. */
function humanReadableNoMatch({
  sender,
  destination,
  targetAmount,
  latestUsdcSend,
  expectedSender,
}) {
  const lines = [
    `EXPECTED (verify URL): pay ${targetAmount} USDC to ${shortenAddr(destination)} (${destination}), from sender ${shortenAddr(sender)} (${sender})`,
  ];
  if (!latestUsdcSend) {
    lines.push(
      "LATEST USDC SEND: none in this ledger batch — no USDC transfer rows to compare."
    );
    lines.push(
      "WHY NO MATCH: nothing matched filters; if you did send USDC, HL may not list it yet or destination may be wrong."
    );
    return lines;
  }
  lines.push(
    `LATEST USDC SEND (Hyperliquid ledger, newest by time): ${latestUsdcSend.amountFromLedger} USDC from ${shortenAddr(latestUsdcSend.ledgerSender)} (${latestUsdcSend.ledgerSender}) to ${shortenAddr(latestUsdcSend.ledgerDestination)} (${latestUsdcSend.ledgerDestination}), hash ${latestUsdcSend.hash}`
  );
  const expS = expectedSender.toLowerCase();
  const ledS = (latestUsdcSend.ledgerSender || "").toLowerCase();
  const expD = destination.toLowerCase();
  const ledD = (latestUsdcSend.ledgerDestination || "").toLowerCase();
  const amountOk =
    Math.abs(latestUsdcSend.amountFromLedger - targetAmount) <= 0.01;
  const senderOk = expS === ledS;
  const destOk = expD === ledD;
  const reasons = [];
  if (!senderOk) {
    let extra = "";
    if (expS.length === ledS.length) {
      for (let i = 0; i < expS.length; i++) {
        if (expS[i] !== ledS[i]) {
          extra = ` (first differing char at index ${i}: '${expS[i]}' vs '${ledS[i]}'; tail expected …${expS.slice(-6)} vs ledger …${ledS.slice(-6)})`;
          break;
        }
      }
    }
    reasons.push(`sender: you said ${shortenAddr(sender)} but HL recorded payer as ${shortenAddr(latestUsdcSend.ledgerSender)}${extra}`);
  }
  if (!amountOk) {
    reasons.push(
      `amount: you said ${targetAmount} but HL row has ${latestUsdcSend.amountFromLedger}`
    );
  }
  if (!destOk) {
    reasons.push(
      `destination: you said ${shortenAddr(destination)} but HL row payee is ${shortenAddr(latestUsdcSend.ledgerDestination)}`
    );
  }
  lines.push(
    `ROW CHECKS: senderMatch=${senderOk} amountMatch=${amountOk} destinationMatch=${destOk}`
  );
  lines.push(
    reasons.length
      ? `WHY NO MATCH: ${reasons.join("; ")}`
      : "WHY NO MATCH: failed time window or non-send rows only (see rejectionCounts)."
  );
  return lines;
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

export async function GET(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination");
  const sender = searchParams.get("sender");
  const amount = searchParams.get("amount");
  const requestId = `hlv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  verifyLog("request", {
    requestId,
    destination,
    sender,
    amount,
  });

  if (!destination || !isValidEvmAddress(destination)) {
    return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
  }
  if (!sender || !isValidEvmAddress(sender)) {
    return NextResponse.json({ error: "Invalid sender" }, { status: 400 });
  }
  if (!amount || isNaN(Number(amount))) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    // Query Hyperliquid for recent non-funding ledger updates (includes internal transfers)
    const res = await fetch(HL_API_URL + "/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "userNonFundingLedgerUpdates",
        user: destination,
      }),
    });

    if (!res.ok) {
      console.error("[verify-hl-payment] HL API error:", res.status);
      return NextResponse.json(
        { error: "Hyperliquid API error" },
        { status: 502 }
      );
    }

    const updates = await res.json();
    const targetAmount = Number(amount);
    const expectedSender = sender.toLowerCase();
    const now = Date.now();
    let scanned = 0;
    let nonSend = 0;
    let nonUsdc = 0;
    let senderMismatch = 0;
    let amountMismatch = 0;
    let tooOld = 0;

    /** Most recent USDC send on this destination ledger (by `time`), for no-match logging only. */
    let latestUsdcSend = null;

    if (!Array.isArray(updates)) {
      verifyLog("no-match", {
        requestId,
        summary:
          "Hyperliquid /info body for userNonFundingLedgerUpdates was not an array.",
        hlResponseType: updates === null ? "null" : typeof updates,
        hlResponseKeys:
          updates && typeof updates === "object"
            ? Object.keys(updates)
            : undefined,
        expectedFromRequest: {
          sender,
          destinationHlUser: destination,
          amount: targetAmount,
          amountTolerance: 0.01,
          maxAgeMs: TEN_MINUTES_MS,
        },
      });
      return NextResponse.json({ verified: false });
    }

    // Search for a matching USDC send
    // HL API returns array of {time, hash, delta: {type, user, destination, token, amount, usdcValue, ...}}
    for (const update of updates) {
      scanned += 1;
      const delta = update.delta;
      if (!delta) continue;

      // USDC transfers show as type "send"
      if (delta.type !== "send") {
        nonSend += 1;
        continue;
      }

      // Must be USDC
      if (delta.token !== "USDC") {
        nonUsdc += 1;
        continue;
      }

      const transferSender = (delta.user || "").toLowerCase();
      const transferAmount = Number(delta.amount || delta.usdcValue || 0);
      const transferTime = update.time || 0;

      if (!latestUsdcSend || transferTime > latestUsdcSend.time) {
        latestUsdcSend = {
          hash: update.hash,
          time: transferTime,
          ageMs: now - transferTime,
          ledgerSender: delta.user || null,
          ledgerDestination: delta.destination ?? null,
          amountFromLedger: transferAmount,
          deltaAmount: delta.amount,
          deltaUsdcValue: delta.usdcValue,
        };
      }

      if (transferSender !== expectedSender) {
        senderMismatch += 1;
        continue;
      }

      if (Math.abs(transferAmount - targetAmount) > 0.01) {
        amountMismatch += 1;
        continue;
      }

      if (now - transferTime > TEN_MINUTES_MS) {
        tooOld += 1;
        continue;
      }

      verifyLog("verified", {
        requestId,
        txHash: update.hash,
        transferTime,
        transferAmount,
        transferSender,
        destination,
      });

      return NextResponse.json({
        verified: true,
        txHash: update.hash || `hl-transfer-${transferTime}`,
        amount: transferAmount,
        timestamp: transferTime,
      });
    }

    const rejectionCounts = {
      nonSend,
      nonUsdc,
      senderMismatch,
      amountMismatch,
      tooOld,
    };
    const dominantReason = Object.entries(rejectionCounts).reduce(
      (best, [key, count]) => (count > best.count ? { key, count } : best),
      { key: null, count: -1 }
    );

    let latestUsdcSendLog = null;
    if (latestUsdcSend) {
      const ls = latestUsdcSend.ledgerSender || "";
      latestUsdcSendLog = {
        ...latestUsdcSend,
        vsExpected: {
          senderMatch: ls.toLowerCase() === expectedSender,
          expectedSender: sender,
          amountMatch:
            Math.abs(latestUsdcSend.amountFromLedger - targetAmount) <= 0.01,
          expectedAmount: targetAmount,
          withinMaxAge: now - latestUsdcSend.time <= TEN_MINUTES_MS,
          maxAgeMs: TEN_MINUTES_MS,
        },
      };
    }

    verifyLog("no-match", {
      requestId,
      scanned,
      summary: dominantReason.count > 0
        ? `No ledger row matched. Largest rejection bucket: ${dominantReason.key} (${dominantReason.count} of ${scanned} scanned).`
        : scanned === 0
          ? "No ledger updates returned from Hyperliquid for this destination."
          : "No rejecting buckets recorded (unexpected).",
      humanReadable: humanReadableNoMatch({
        sender,
        destination,
        targetAmount,
        latestUsdcSend,
        expectedSender,
      }),
      expectedFromRequest: {
        sender,
        destinationHlUser: destination,
        amount: targetAmount,
        amountTolerance: 0.01,
        maxAgeMs: TEN_MINUTES_MS,
      },
      rejectionCounts,
      latestUsdcSend: latestUsdcSendLog,
    });

    return NextResponse.json({ verified: false });
  } catch (err) {
    console.error("[verify-hl-payment] Verification error:", err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
