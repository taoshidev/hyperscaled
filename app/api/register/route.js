import { NextResponse } from "next/server";
import { reportError, reportCritical, SEVERITY } from "@/lib/errors";
import { HTTPFacilitatorClient } from "@x402/core/server";
import {
  encodePaymentRequiredHeader,
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import { getMinerBySlug, getTiersForMiner, TIERS } from "@/lib/miners";
import { isValidHLAddress, isValidEvmAddress, isValidEmail } from "@/lib/validation";
import { USDC_ADDRESS, USDC_DECIMALS, USDC_EIP712_NAME, USDC_EIP712_VERSION, BASE_NETWORK, FACILITATOR_URL, BASESCAN_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { users, registrations, affiliates } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { facilitator as cdpFacilitator } from "@coinbase/x402";
import { checkValidatorStatus, isConfirmedDeregistered } from "@/lib/validator";
import { isAnyDevTestWallet, DEV_TEST_PRICE } from "@/lib/dev-test";

const USE_TESTNET = process.env.USE_TESTNET === "true";

const facilitator = USE_TESTNET
  ? new HTTPFacilitatorClient({ url: FACILITATOR_URL })
  : new HTTPFacilitatorClient(cdpFacilitator);

function escapeHtml(str) {
  if (typeof str !== "string") str = String(str ?? "");
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sanitizeApiKey(key) {
  if (key == null) return null;
  const t = String(key)
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
  return t || null;
}

/** Prefer DB (entity_miners.api_key); env only when DB has no key. */
function resolveMinerApiKey(miner) {
  const fromDb = sanitizeApiKey(miner.apiKey);
  if (fromDb) return fromDb;
  const slugEnv = `ENTITY_MINER_API_KEY_${miner.slug.replace(/-/g, "_").toUpperCase()}`;
  return sanitizeApiKey(process.env[slugEnv]) || sanitizeApiKey(process.env.ENTITY_MINER_API_KEY) || null;
}

/**
 * Vanta entity miner (vanta-network EntityMinerRestServer) only reads `Authorization`
 * (Bearer + key, or raw key). Keys must exist in the miner's api_keys.json — see
 * vanta_api/base_rest_server.py::_get_api_key_safe and api_key_refresh.APIKeyMixin.
 */
async function postCreateHlSubaccount(baseUrl, payload, apiKey) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return fetch(`${baseUrl}/api/create-hl-subaccount`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

function buildPaymentRequirements(miner, tier, requestUrl, overridePrice) {
  const minerWallet = miner.usdcWallet;
  const price = overridePrice ?? Number(tier.priceUsdc);
  const tierLabel = TIERS.find((t) => t.accountSize === tier.accountSize)?.label || `$${tier.accountSize / 1000}K`;

  const extra = { name: USDC_EIP712_NAME, version: USDC_EIP712_VERSION };

  return {
    requirements: {
      scheme: "exact",
      network: BASE_NETWORK,
      asset: USDC_ADDRESS,
      amount: String(price * 10 ** USDC_DECIMALS),
      payTo: minerWallet,
      maxTimeoutSeconds: 300,
      extra,
    },
    paymentRequired: {
      x402Version: 2,
      accepts: [
        {
          scheme: "exact",
          network: BASE_NETWORK,
          asset: USDC_ADDRESS,
          amount: String(price * 10 ** USDC_DECIMALS),
          payTo: minerWallet,
          maxTimeoutSeconds: 300,
          extra,
        },
      ],
      resource: {
        url: requestUrl,
        method: "POST",
      },
      description: `${miner.name} ${tierLabel} Account Registration`,
    },
    minerWallet,
    price,
  };
}

export async function POST(request) {
  const reqId = Math.random().toString(36).slice(2, 10);
  const hasPaymentSignature = Boolean(request.headers.get("payment-signature"));
  console.info("[REGISTRATION] POST /api/register received", {
    reqId,
    url: request.url,
    hasPaymentSignature,
  });

  const bodyText = await request.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    console.warn("[REGISTRATION] invalid JSON body", { reqId, bodyPreview: bodyText.slice(0, 200) });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    minerSlug,
    hlAddress,
    accountSize,
    payoutAddress,
    email,
    tierIndex,
    affiliateUtm,
    paymentMethod,
    hlTransferHash,
    hlTransferSender,
  } = body;

  console.info("[REGISTRATION] body parsed", {
    reqId,
    minerSlug,
    hlAddress,
    accountSize,
    payoutAddress,
    hasEmail: Boolean(email),
    tierIndex,
    affiliateUtm,
    paymentMethod,
    hasTransferHash: Boolean(hlTransferHash),
    hlTransferSender,
  });

  if (!minerSlug || !hlAddress || !accountSize || tierIndex == null) {
    console.warn("[REGISTRATION] missing required fields", { reqId, minerSlug, hlAddress, accountSize, tierIndex });
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (email && !isValidEmail(email)) {
    console.warn("[REGISTRATION] invalid email", { reqId });
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const miner = await getMinerBySlug(minerSlug);
  if (!miner) {
    console.warn("[REGISTRATION] unknown miner", { reqId, minerSlug });
    return NextResponse.json({ error: "Unknown miner" }, { status: 400 });
  }
  console.info("[REGISTRATION] miner resolved", {
    reqId,
    minerSlug,
    minerHotkey: miner.hotkey,
    hasApiUrl: Boolean(miner.apiUrl),
    hasDbApiKey: Boolean(miner.apiKey),
  });

  if (!isValidHLAddress(hlAddress)) {
    console.warn("[REGISTRATION] invalid HL address", { reqId, hlAddress });
    return NextResponse.json({ error: "Invalid HL address" }, { status: 400 });
  }

  if (payoutAddress && !isValidEvmAddress(payoutAddress)) {
    console.warn("[REGISTRATION] invalid payout address", { reqId, payoutAddress });
    return NextResponse.json({ error: "Invalid payout address" }, { status: 400 });
  }

  const minerTiers = await getTiersForMiner(miner.hotkey);
  const activeTiers = minerTiers.filter((t) => t.isActive);
  console.info("[REGISTRATION] tiers loaded", {
    reqId,
    totalTiers: minerTiers.length,
    activeTiers: activeTiers.length,
    requestedTierIndex: tierIndex,
  });

  if (tierIndex < 0 || tierIndex >= activeTiers.length) {
    console.warn("[REGISTRATION] tier index out of range", { reqId, tierIndex, activeTiersLength: activeTiers.length });
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const tier = activeTiers[tierIndex];

  if (accountSize !== tier.accountSize) {
    console.warn("[REGISTRATION] account size mismatch", {
      reqId,
      accountSize,
      tierAccountSize: tier.accountSize,
    });
    return NextResponse.json({ error: "Account size does not match selected tier" }, { status: 400 });
  }

  // Reject duplicate registrations — don't let users pay twice for the same miner + HL address
  try {
    const [existing] = await db
      .select({ id: registrations.id, status: registrations.status })
      .from(registrations)
      .where(
        and(
          eq(registrations.minerHotkey, miner.hotkey),
          eq(registrations.hlAddress, hlAddress),
          inArray(registrations.status, ["registered", "pending"]),
        ),
      )
      .limit(1);

    if (existing) {
      console.info("[REGISTRATION] existing registration found", {
        reqId,
        existingId: existing.id,
        existingStatus: existing.status,
      });
      if (existing.status === "registered") {
        // Before blocking, check the validator — the user may have been de-registered
        // externally, leaving the DB out of sync.
        const validatorStatus = await checkValidatorStatus(hlAddress);
        console.info("[REGISTRATION] validator status check", {
          reqId,
          hlAddress,
          validatorStatus: validatorStatus.status,
        });
        if (isConfirmedDeregistered(validatorStatus.status)) {
          // Validator confirms they're no longer active — sync the DB and allow re-registration
          await db
            .update(registrations)
            .set({
              status: "deregistered",
              statusDetail: {
                deregisteredAt: new Date().toISOString(),
                validatorStatus: validatorStatus.status,
              },
              updatedAt: new Date(),
            })
            .where(eq(registrations.id, existing.id));
          console.info("[register] De-registration detected — DB synced, allowing re-registration", {
            hlAddress,
            minerSlug,
            validatorStatus: validatorStatus.status,
          });
          // Fall through — allow the registration to proceed
        } else {
          // Active on validator (or validator unreachable — safe default: block)
          console.warn("[REGISTRATION] blocked — already registered and active", { reqId, hlAddress, minerSlug });
          return NextResponse.json(
            { error: "This HL address is already registered with this miner." },
            { status: 409 },
          );
        }
      } else {
        // pending — payment already recorded, don't risk a double-charge
        console.warn("[REGISTRATION] blocked — pending registration already exists", { reqId, hlAddress, minerSlug });
        return NextResponse.json(
          { error: "A registration for this HL address is already being processed. Please wait for it to complete." },
          { status: 409 },
        );
      }
    } else {
      console.info("[REGISTRATION] no existing registration — proceeding", { reqId });
    }
  } catch (err) {
    console.error("[REGISTRATION] duplicate check failed", { reqId, error: err.message });
    // Continue — better to risk a duplicate than block a legitimate registration
  }

  // Compute wallet and price early — both payment paths need them.
  // The discount applies if EITHER the HL trading wallet OR the paying wallet
  // is in DEV_TEST_WALLETS. The paying wallet is `hlTransferSender` for both
  // EIP-712 (passed in body) and x402 (the connected signer). For x402, the
  // claim is verified later against `paymentPayload.payload.authorization.from`.
  const minerWallet = miner.usdcWallet;
  const price = Number(tier.priceUsdc);
  const devTest = isAnyDevTestWallet(hlAddress, hlTransferSender);
  const effectivePrice = devTest ? DEV_TEST_PRICE : price;

  console.info("[REGISTRATION] pricing computed", {
    reqId,
    minerWallet,
    listPrice: price,
    devTest,
    effectivePrice,
  });

  if (!minerWallet) {
    console.error("[REGISTRATION] miner wallet not configured", { reqId, minerSlug });
    return NextResponse.json({ error: "Miner wallet not configured" }, { status: 500 });
  }

  let txHash;
  let effectivePayoutAddress;
  let settleResult = null;

  // ── Hyperliquid payment path (extension "hyperliquid" + direct "eip712") ──
  if (paymentMethod === "hyperliquid" || paymentMethod === "eip712") {
    console.info("[REGISTRATION] hyperliquid branch entered", {
      reqId,
      minerSlug,
      minerWallet,
      hlAddress,
      payoutAddress,
      tierIndex,
      price,
      hasTransferHash: Boolean(hlTransferHash),
    });

    if (!hlTransferHash) {
      console.warn("[REGISTRATION] missing HL transfer hash", { reqId });
      return NextResponse.json({ error: "Missing HL transfer hash" }, { status: 400 });
    }

    const normalizedTxHash = String(hlTransferHash).toLowerCase().startsWith("0x")
      ? String(hlTransferHash).toLowerCase()
      : null;

    if (!normalizedTxHash) {
      console.warn("[REGISTRATION] invalid HL transfer hash format", { reqId, hlTransferHash });
      return NextResponse.json({ error: "Invalid HL transfer hash format" }, { status: 400 });
    }

    // Reject reuse — same tx hash must not register twice
    try {
      const [existingTx] = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(eq(registrations.txHash, hlTransferHash))
        .limit(1);

      if (existingTx) {
        console.warn("[REGISTRATION] duplicate tx hash", { reqId, hlTransferHash, existingId: existingTx.id });
        return NextResponse.json(
          { error: "This transaction has already been used for a registration." },
          { status: 409 },
        );
      }
    } catch (err) {
      console.error("[REGISTRATION] txHash uniqueness check failed", { reqId, error: err.message });
    }

    // Verify the transfer on Hyperliquid — exact hash match only, no sender-based fallback
    const hlApiUrl = USE_TESTNET
      ? "https://api.hyperliquid-testnet.xyz"
      : "https://api.hyperliquid.xyz";

    const TEN_MINUTES = 10 * 60 * 1000;

    // Query both the sender's ledger (reliable "send" delta, low-volume) and
    // the receiver's ledger (as fallback). Busy miner wallets can push the
    // relevant update out of the default response window on the receiver side,
    // and the receiver's ledger sometimes surfaces the transfer under a delta
    // type other than "send" ("spotSend", "internalTransfer", …). Querying
    // the sender is the robust path when we have a claimed/derivable sender.
    const senderCandidates = [hlTransferSender, hlAddress]
      .map((a) => (a ? String(a).toLowerCase() : ""))
      .filter((a) => /^0x[a-f0-9]{40}$/.test(a));
    const uniqueSenders = Array.from(new Set(senderCandidates));

    const fetchLedger = async (user, startTime) => {
      try {
        const res = await fetch(hlApiUrl + "/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "userNonFundingLedgerUpdates",
            user,
            ...(startTime ? { startTime } : {}),
          }),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn("[register] HL ledger fetch failed", { user, error: err.message });
        return [];
      }
    };

    // Accept any delta type that represents a USDC spot transfer. "send" is
    // what the sender's ledger shows; receivers sometimes show these under
    // alternate names — keep the set broad so we don't reject real transfers.
    const ACCEPTED_SEND_TYPES = new Set([
      "send",
      "spotSend",
      "spotTransfer",
      "accountClassTransfer",
      "internalTransfer",
    ]);

    const nowMs = Date.now();
    const startTime = nowMs - TEN_MINUTES;
    console.info("[REGISTRATION] querying HL ledgers", {
      reqId,
      normalizedTxHash,
      uniqueSenders,
      minerWallet,
      windowMs: TEN_MINUTES,
    });
    const ledgerQueries = [
      ...uniqueSenders.map((u) => fetchLedger(u, startTime)),
      fetchLedger(minerWallet, startTime),
    ];
    const ledgerResults = await Promise.all(ledgerQueries);
    console.info("[REGISTRATION] HL ledger responses", {
      reqId,
      responseCounts: ledgerResults.map((r) => r.length),
    });

    let matchedUpdate = null;
    for (const updates of ledgerResults) {
      for (const update of updates) {
        const delta = update?.delta;
        if (!delta) continue;
        if (!ACCEPTED_SEND_TYPES.has(delta.type)) continue;
        if (delta.token && delta.token !== "USDC") continue;
        const updateHash = (update.hash || "").toLowerCase();
        if (updateHash !== normalizedTxHash) continue;
        matchedUpdate = update;
        break;
      }
      if (matchedUpdate) break;
    }

    let transferVerified = false;
    if (matchedUpdate) {
      const delta = matchedUpdate.delta;
      // Sender is usually `delta.user`; on receiver-side ledgers it may be
      // `delta.source` or `delta.from`. Try them all.
      const rawSender = delta.user || delta.source || delta.from || "";
      const transferSender = String(rawSender).toLowerCase();
      const transferAmount = Math.abs(
        Number(delta.amount ?? delta.usdcValue ?? 0),
      );
      const isRecent = nowMs - (matchedUpdate.time || 0) < TEN_MINUTES;

      if (transferSender && transferSender !== hlAddress.toLowerCase()) {
        console.info(
          "[REGISTRATION] HL sender differs from hlAddress (cross-wallet payment)",
          {
            reqId,
            minerSlug,
            txHash: matchedUpdate.hash,
            hlAddress,
            actualSender: transferSender,
            claimedSender: hlTransferSender || "not provided",
          },
        );
      }

      // Recompute discount using the verified on-chain sender AND the claimed
      // sender — either one qualifying is enough to grant the discount.
      const trueDevTest = isAnyDevTestWallet(
        hlAddress,
        transferSender,
        hlTransferSender,
      );
      const trueEffectivePrice = trueDevTest ? DEV_TEST_PRICE : price;

      // Allow exact match (±0.01 for HL's internal rounding) OR overpayment.
      // Rejecting only when the user under-paid protects revenue without
      // stranding users whose transfer rounded differently from the UI.
      const underpaid = transferAmount < trueEffectivePrice - 0.01;
      if (underpaid) {
        console.warn("[REGISTRATION] HL amount mismatch on hash match", {
          reqId,
          minerSlug,
          txHash: matchedUpdate.hash,
          expected: trueEffectivePrice,
          actual: transferAmount,
          devTest: trueDevTest,
        });
        return NextResponse.json(
          { error: "Transfer amount does not match the expected price." },
          { status: 400 },
        );
      }

      if (!isRecent) {
        console.warn("[REGISTRATION] HL transfer too old", {
          reqId,
          minerSlug,
          txHash: matchedUpdate.hash,
          transferTime: matchedUpdate.time,
        });
        return NextResponse.json(
          { error: "Transfer is too old. Please make a new transfer." },
          { status: 400 },
        );
      }

      transferVerified = true;
      console.info("[REGISTRATION] hyperliquid transfer verified (exact hash)", {
        reqId,
        minerSlug,
        txHash: matchedUpdate.hash,
        transferSender,
        transferAmount,
        transferTime: matchedUpdate.time,
      });
    } else {
      console.warn("[REGISTRATION] no matching HL ledger entry for tx", { reqId, normalizedTxHash });
    }

    if (!transferVerified) {
      return NextResponse.json(
        { error: "Could not verify Hyperliquid transfer. Ensure you sent the correct amount from your registered wallet." },
        { status: 400 },
      );
    }

    txHash = hlTransferHash;
    effectivePayoutAddress = payoutAddress || hlAddress;

  // ── x402 payment path (Base chain USDC) ───────────────────────────────────
  } else {
    console.info("[REGISTRATION] x402 branch entered", { reqId, minerSlug, devTest });
    const { requirements, paymentRequired } = buildPaymentRequirements(
      miner,
      tier,
      request.url,
      devTest ? DEV_TEST_PRICE : undefined,
    );

    const paymentSignatureHeader = request.headers.get("payment-signature");

    if (!paymentSignatureHeader) {
      console.info("[REGISTRATION] x402 probe — returning 402 Payment Required", { reqId });
      const encoded = encodePaymentRequiredHeader(paymentRequired);
      return new Response(JSON.stringify(paymentRequired), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "PAYMENT-REQUIRED": encoded,
        },
      });
    }

    let paymentPayload;
    try {
      paymentPayload = decodePaymentSignatureHeader(paymentSignatureHeader);
    } catch (err) {
      console.warn("[REGISTRATION] x402 invalid payment signature header", { reqId, error: err?.message });
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }
    console.info("[REGISTRATION] x402 payment payload decoded", {
      reqId,
      actualSigner: paymentPayload?.payload?.authorization?.from,
      x402Version: paymentPayload?.x402Version,
    });

    // Recompute the discount against the actual signer (truth source). If the
    // client lied about the payer to get cheaper requirements, the rebuilt
    // requirements will charge full price and the signed payload will fail
    // facilitator verification (signed amount won't match required amount).
    const actualSigner = paymentPayload?.payload?.authorization?.from;
    const trueDevTest = isAnyDevTestWallet(hlAddress, actualSigner);
    const trueRequirements = trueDevTest === devTest
      ? requirements
      : buildPaymentRequirements(
          miner,
          tier,
          request.url,
          trueDevTest ? DEV_TEST_PRICE : undefined,
        ).requirements;

    let verifyResult;
    try {
      console.info("[REGISTRATION] x402 calling facilitator.verify", { reqId, trueDevTest });
      verifyResult = await facilitator.verify(paymentPayload, trueRequirements);
      console.info("[REGISTRATION] x402 facilitator.verify result", {
        reqId,
        isValid: verifyResult?.isValid,
        invalidReason: verifyResult?.invalidReason,
      });
    } catch (err) {
      console.error("[REGISTRATION] x402 facilitator.verify threw", { reqId, error: err?.message });
      reportCritical(err, {
        source: "api/register",
        metadata: { step: "facilitator_verify" },
      });
      return NextResponse.json(
        { error: `Payment verification failed: ${err?.message || "unknown error"}` },
        { status: 502 },
      );
    }

    if (!verifyResult?.isValid) {
      reportError(new Error("Payment verification invalid"), {
        source: "api/register",
        severity: SEVERITY.ERROR,
        metadata: { step: "facilitator_verify", reason: verifyResult?.invalidReason },
      });
      const encoded = encodePaymentRequiredHeader(paymentRequired);
      return new Response(
        JSON.stringify({ ...paymentRequired, error: verifyResult?.invalidReason || "Payment verification failed" }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "PAYMENT-REQUIRED": encoded,
          },
        },
      );
    }

    try {
      console.info("[REGISTRATION] x402 calling facilitator.settle", { reqId });
      settleResult = await facilitator.settle(paymentPayload, trueRequirements);
      console.info("[REGISTRATION] x402 facilitator.settle result", {
        reqId,
        success: settleResult?.success,
        transaction: settleResult?.transaction,
        errorReason: settleResult?.errorReason,
      });
    } catch (err) {
      console.error("[REGISTRATION] x402 facilitator.settle threw", { reqId, error: err?.message });
      reportCritical(err, {
        source: "api/register",
        metadata: { step: "facilitator_settle" },
      });
      return NextResponse.json(
        {
          error: "Payment settlement failed",
          message: "Your payment was verified but settlement failed. Please contact support.",
        },
        { status: 500 },
      );
    }

    if (!settleResult?.success) {
      reportCritical(new Error("Payment settlement unsuccessful"), {
        source: "api/register",
        metadata: { step: "facilitator_settle", reason: settleResult?.errorReason },
      });
      return NextResponse.json(
        {
          error: "Payment settlement was not successful",
          message: settleResult?.errorReason || settleResult?.errorMessage || "The facilitator could not complete the on-chain transfer. Please try again.",
        },
        { status: 500 },
      );
    }

    txHash = settleResult?.transaction || "";
    effectivePayoutAddress = payoutAddress || paymentPayload?.payload?.authorization?.from;
  }

  console.info("[REGISTRATION] payment accepted, proceeding to user upsert", {
    reqId,
    txHash,
    effectivePayoutAddress,
  });

  // Resolve affiliate (if any) before upserting user
  let resolvedAffiliateId = null;
  if (affiliateUtm) {
    try {
      const [aff] = await db
        .select({ id: affiliates.id })
        .from(affiliates)
        .where(and(eq(affiliates.slug, affiliateUtm), eq(affiliates.isActive, true)))
        .limit(1);
      if (aff) resolvedAffiliateId = aff.id;
      console.info("[REGISTRATION] affiliate lookup", { reqId, affiliateUtm, resolvedAffiliateId });
    } catch (err) {
      reportError(err, {
        source: "api/register",
        metadata: { step: "affiliate_lookup", affiliateUtm },
      });
    }
  }

  // Upsert user record
  let userId = null;
  let didAttributeAffiliate = false;
  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.wallet, effectivePayoutAddress))
      .limit(1);

    if (existing) {
      userId = existing.id;
      const updates = {};
      if (email && email !== existing.email) updates.email = email;
      if (affiliateUtm && !existing.utmCode) updates.utmCode = affiliateUtm;
      if (resolvedAffiliateId && !existing.affiliateId) {
        updates.affiliateId = resolvedAffiliateId;
        didAttributeAffiliate = true;
      }
      if (Object.keys(updates).length > 0) {
        await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, existing.id));
      }
      console.info("[REGISTRATION] user upsert — existing", {
        reqId,
        userId,
        updatedFields: Object.keys(updates),
      });
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          wallet: effectivePayoutAddress,
          email: email || null,
          utmCode: affiliateUtm || null,
          affiliateId: resolvedAffiliateId,
        })
        .returning({ id: users.id });
      userId = newUser.id;
      if (resolvedAffiliateId) didAttributeAffiliate = true;
      console.info("[REGISTRATION] user upsert — inserted new", { reqId, userId });
    }

    if (didAttributeAffiliate && resolvedAffiliateId) {
      await db
        .update(affiliates)
        .set({
          useCount: sql`${affiliates.useCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(affiliates.id, resolvedAffiliateId));
    }
  } catch (err) {
    reportCritical(err, {
      source: "api/register",
      metadata: {
        step: "user_upsert",
        wallet: effectivePayoutAddress,
        email,
        txHash,
        dbError: err?.message,
      },
    });
    // Continue — registration insert can still work with userId = null
  }

  // Call miner API
  let registered = false;
  let statusDetail = null;

  if (miner.apiUrl) {
    try {
      const apiKey = resolveMinerApiKey(miner);
      const hadDbKey = Boolean(sanitizeApiKey(miner.apiKey));
      if (!apiKey) {
        console.warn(
          `[REGISTRATION] No API key for miner slug=${miner.slug}; set entity_miners.api_key or ENTITY_MINER_API_KEY_${miner.slug.replace(/-/g, "_").toUpperCase()}`,
          { reqId },
        );
      }
      const baseUrl = miner.apiUrl.replace(/\/+$/, "");
      console.info("[REGISTRATION] calling miner API create-hl-subaccount", {
        reqId,
        baseUrl,
        hasApiKey: Boolean(apiKey),
        hl_address: hlAddress,
        account_size: accountSize,
        payout_address: effectivePayoutAddress,
      });
      const res = await postCreateHlSubaccount(
        baseUrl,
        {
          hl_address: hlAddress,
          account_size: accountSize,
          payout_address: effectivePayoutAddress,
        },
        apiKey,
      );
      console.info("[REGISTRATION] miner API response", { reqId, status: res.status, ok: res.ok });
      if (!res.ok && res.status === 401 && apiKey) {
        console.warn(
          `[REGISTRATION] Miner API 401 Unauthorized: key must match an entry in the entity miner's api_keys.json (same string as entity_miners.api_key; from DB=${hadDbKey}, len=${apiKey.length})`,
          { reqId },
        );
      }
      if (res.ok) {
        registered = true;
      } else {
        const errText = await res.text().catch(() => "");
        console.warn("[REGISTRATION] miner API returned error body", { reqId, apiStatus: res.status, errText: errText.slice(0, 500) });
        reportError(new Error("Miner API error response"), {
          source: "api/register",
          metadata: { step: "miner_api", apiStatus: res.status },
        });
        statusDetail = { reason: "miner_api_error", error: errText, apiStatus: res.status };
      }
    } catch (err) {
      console.error("[REGISTRATION] miner API unreachable", { reqId, error: err.message });
      reportError(err, { source: "api/register", metadata: { step: "miner_api_unreachable" } });
      statusDetail = { reason: "miner_api_unreachable", error: err.message };
    }
  } else {
    console.info("[REGISTRATION] miner has no apiUrl — skipping miner API call", { reqId, minerSlug });
  }

  // Insert registration record — this MUST succeed; the user already paid.
  // Retry with backoff so a transient DB blip doesn't strand the user on the
  // "contact support" message when their payment has already settled.
  const registrationRow = {
    userId,
    minerHotkey: miner.hotkey,
    hlAddress,
    accountSize,
    payoutAddress: effectivePayoutAddress,
    tierIndex,
    priceUsdc: String(effectivePrice),
    txHash,
    status: registered ? "registered" : "pending",
    statusDetail: {
      paymentMethod: paymentMethod || "x402",
      ...(devTest ? { devTest: true, originalPrice: price } : {}),
      ...(statusDetail || {}),
    },
  };

  console.info("[REGISTRATION] inserting registration row", {
    reqId,
    rowStatus: registrationRow.status,
    userId,
    txHash,
  });

  let insertErr = null;
  const INSERT_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= INSERT_ATTEMPTS; attempt++) {
    try {
      await db.insert(registrations).values(registrationRow);
      insertErr = null;
      console.info("[REGISTRATION] registration insert succeeded", { reqId, attempt });
      break;
    } catch (err) {
      insertErr = err;
      console.warn("[REGISTRATION] registration insert failed", {
        reqId,
        attempt,
        hlAddress,
        txHash,
        error: err?.message,
      });
      if (attempt < INSERT_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 250 * 2 ** (attempt - 1)));
      }
    }
  }

  if (insertErr) {
    reportCritical(insertErr, {
      source: "api/register",
      metadata: {
        step: "registration_insert",
        hlAddress,
        txHash,
        accountSize,
        tierIndex,
        userId,
        payoutAddress: effectivePayoutAddress,
        minerHotkey: miner.hotkey,
        dbError: insertErr?.message,
        attempts: INSERT_ATTEMPTS,
      },
    });

    // Payment was already settled on-chain — tell the user so they can contact support.
    return NextResponse.json(
      {
        error: "Registration could not be saved",
        message:
          "Your payment was processed on-chain but we failed to record your registration. Please contact support with your transaction hash.",
        txHash,
      },
      { status: 500 },
    );
  }

  if (process.env.SMTP_USER && email) {
    try {
      const { sendEmail } = await import("@/lib/email");
      await sendEmail({
        to: email,
        subject: registered
          ? `\u2713 Registered with Hyperscaled Trading`
          : `\u231B Registration Pending \u2014 Hyperscaled Trading`,
        html: registered
          ? registeredEmailHtml(miner, accountSize, hlAddress, effectivePayoutAddress, txHash)
          : pendingEmailHtml(miner, accountSize, hlAddress, effectivePayoutAddress, txHash),
      });
      console.info("[REGISTRATION] confirmation email sent", { reqId, registered });
    } catch (err) {
      console.warn("[REGISTRATION] confirmation email send failed", { reqId, error: err?.message });
    }
  }

  const responseBody = {
    status: registered ? "registered" : "pending",
    message: registered
      ? "Your trading account has been created."
      : "Your payment is confirmed on-chain. Account setup is in progress \u2014 we will follow up via email.",
    txHash,
  };

  const responseHeaders = { "Content-Type": "application/json" };
  if (settleResult) {
    responseHeaders["PAYMENT-RESPONSE"] = encodePaymentResponseHeader(settleResult);
  }

  console.info("[REGISTRATION] POST /api/register complete", {
    reqId,
    status: responseBody.status,
    txHash,
  });

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: responseHeaders,
  });
}

function registeredEmailHtml(miner, accountSize, hlAddress, payoutAddress, txHash) {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px;">\u2705</div>
        <h1 style="font-size: 24px; font-weight: 700; margin: 16px 0 8px;">Registration Complete</h1>
        <p style="color: #888; font-size: 14px;">Your Hyperscaled Trading account is ready</p>
      </div>
      <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px;" cellpadding="8">
          <tr><td style="color: #888;">Firm</td><td style="text-align: right; font-weight: 600;">${escapeHtml(miner.name)}</td></tr>
          <tr><td style="color: #888;">Account Size</td><td style="text-align: right; font-weight: 600;">$${escapeHtml(accountSize.toLocaleString())}</td></tr>
          <tr><td style="color: #888;">HL Wallet</td><td style="text-align: right; font-family: monospace; font-size: 12px;">${escapeHtml(hlAddress)}</td></tr>
          <tr><td style="color: #888;">Payout Wallet</td><td style="text-align: right; font-family: monospace; font-size: 12px;">${escapeHtml(payoutAddress)}</td></tr>
        </table>
      </div>
      <div style="text-align: center;">
        <a href="${BASESCAN_URL}/tx/${encodeURIComponent(txHash)}" style="color: ${escapeHtml(miner.color)}; font-size: 14px;">View transaction on BaseScan \u2192</a>
      </div>
      <p style="text-align: center; color: #555; font-size: 12px; margin-top: 32px;">Hyperscaled \u2014 The Decentralized Prop Trading Network</p>
    </div>
  `;
}

function pendingEmailHtml(miner, accountSize, hlAddress, payoutAddress, txHash) {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px;">\u231B</div>
        <h1 style="font-size: 24px; font-weight: 700; margin: 16px 0 8px;">Registration Pending</h1>
        <p style="color: #888; font-size: 14px;">Your payment is confirmed. Account setup with ${escapeHtml(miner.name)} is in progress.</p>
      </div>
      <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px;" cellpadding="8">
          <tr><td style="color: #888;">Firm</td><td style="text-align: right; font-weight: 600;">${escapeHtml(miner.name)}</td></tr>
          <tr><td style="color: #888;">Account Size</td><td style="text-align: right; font-weight: 600;">$${escapeHtml(accountSize.toLocaleString())}</td></tr>
          <tr><td style="color: #888;">HL Wallet</td><td style="text-align: right; font-family: monospace; font-size: 12px;">${escapeHtml(hlAddress)}</td></tr>
          <tr><td style="color: #888;">Payout Wallet</td><td style="text-align: right; font-family: monospace; font-size: 12px;">${escapeHtml(payoutAddress)}</td></tr>
        </table>
      </div>
      <div style="background: #2a2000; border: 1px solid #554400; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #eab308; font-size: 14px; margin: 0;">\u26A0\uFE0F Your payment was received but we could not automatically create your account. Our team will set it up manually and notify you once it's ready.</p>
      </div>
      <div style="text-align: center;">
        <a href="${BASESCAN_URL}/tx/${encodeURIComponent(txHash)}" style="color: ${escapeHtml(miner.color)}; font-size: 14px;">View transaction on BaseScan \u2192</a>
      </div>
      <p style="text-align: center; color: #555; font-size: 12px; margin-top: 32px;">Hyperscaled \u2014 The Decentralized Prop Trading Network</p>
    </div>
  `;
}
