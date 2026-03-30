import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/validation";
import { HL_API_URL } from "@/lib/constants";

const TEN_MINUTES_MS = 10 * 60 * 1000;

// In-memory rate limiter (per IP, 30 req/min)
const rateMap = new Map();
const RATE_WINDOW = 60_000;
const RATE_MAX = 30;

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

  console.info("[verify-hl-payment] request", {
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
    const now = Date.now();
    let scanned = 0;
    let nonSend = 0;
    let nonUsdc = 0;
    let senderMismatch = 0;
    let amountMismatch = 0;
    let tooOld = 0;

    // Search for a matching USDC send
    // HL API returns array of {time, hash, delta: {type, user, destination, token, amount, usdcValue, ...}}
    if (Array.isArray(updates)) {
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

        // Check sender matches (delta.user is the sender)
        const transferSender = (delta.user || "").toLowerCase();
        if (transferSender !== sender.toLowerCase()) {
          senderMismatch += 1;
          continue;
        }

        // Check amount matches (within $0.01 tolerance)
        const transferAmount = Number(delta.amount || delta.usdcValue || 0);
        if (Math.abs(transferAmount - targetAmount) > 0.01) {
          amountMismatch += 1;
          continue;
        }

        // Check recency (within last 10 minutes)
        const transferTime = update.time || 0;
        if (now - transferTime > TEN_MINUTES_MS) {
          tooOld += 1;
          continue;
        }

        console.info("[verify-hl-payment] verified", {
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
    }

    console.info("[verify-hl-payment] no-match", {
      requestId,
      scanned,
      nonSend,
      nonUsdc,
      senderMismatch,
      amountMismatch,
      tooOld,
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
