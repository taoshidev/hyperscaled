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
import { users, registrations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { facilitator as cdpFacilitator } from "@coinbase/x402";
import { checkValidatorStatus, isConfirmedDeregistered } from "@/lib/validator";
import { isDevTestWallet, DEV_TEST_PRICE } from "@/lib/dev-test";

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
  const bodyText = await request.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
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

  if (!minerSlug || !hlAddress || !accountSize || !email || tierIndex == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const miner = await getMinerBySlug(minerSlug);
  if (!miner) {
    return NextResponse.json({ error: "Unknown miner" }, { status: 400 });
  }

  if (!isValidHLAddress(hlAddress)) {
    return NextResponse.json({ error: "Invalid HL address" }, { status: 400 });
  }

  if (payoutAddress && !isValidEvmAddress(payoutAddress)) {
    return NextResponse.json({ error: "Invalid payout address" }, { status: 400 });
  }

  const minerTiers = await getTiersForMiner(miner.hotkey);
  const activeTiers = minerTiers.filter((t) => t.isActive);

  if (tierIndex < 0 || tierIndex >= activeTiers.length) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const tier = activeTiers[tierIndex];

  if (accountSize !== tier.accountSize) {
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
      if (existing.status === "registered") {
        // Before blocking, check the validator — the user may have been de-registered
        // externally, leaving the DB out of sync.
        const validatorStatus = await checkValidatorStatus(hlAddress);
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
          return NextResponse.json(
            { error: "This HL address is already registered with this miner." },
            { status: 409 },
          );
        }
      } else {
        // pending — payment already recorded, don't risk a double-charge
        return NextResponse.json(
          { error: "A registration for this HL address is already being processed. Please wait for it to complete." },
          { status: 409 },
        );
      }
    }
  } catch (err) {
    console.error("[register] Duplicate check failed:", err.message);
    // Continue — better to risk a duplicate than block a legitimate registration
  }

  // Compute wallet and price early — both payment paths need them
  const minerWallet = miner.usdcWallet;
  const price = Number(tier.priceUsdc);
  const devTest = isDevTestWallet(hlAddress);
  const effectivePrice = devTest ? DEV_TEST_PRICE : price;

  if (!minerWallet) {
    return NextResponse.json({ error: "Miner wallet not configured" }, { status: 500 });
  }

  let txHash;
  let effectivePayoutAddress;
  let settleResult = null;

  // ── Hyperliquid payment path (extension "hyperliquid" + direct "eip712") ──
  if (paymentMethod === "hyperliquid" || paymentMethod === "eip712") {
    console.info("[register] hyperliquid branch entered", {
      minerSlug,
      minerWallet,
      hlAddress,
      payoutAddress,
      tierIndex,
      price,
      hasTransferHash: Boolean(hlTransferHash),
    });

    if (!hlTransferHash) {
      return NextResponse.json({ error: "Missing HL transfer hash" }, { status: 400 });
    }

    const normalizedTxHash = String(hlTransferHash).toLowerCase().startsWith("0x")
      ? String(hlTransferHash).toLowerCase()
      : null;

    if (!normalizedTxHash) {
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
        return NextResponse.json(
          { error: "This transaction has already been used for a registration." },
          { status: 409 },
        );
      }
    } catch (err) {
      console.error("[register] txHash uniqueness check failed:", err.message);
    }

    // Verify the transfer on Hyperliquid — exact hash match only, no sender-based fallback
    const hlApiUrl = USE_TESTNET
      ? "https://api.hyperliquid-testnet.xyz"
      : "https://api.hyperliquid.xyz";

    let transferVerified = false;
    try {
      const verifyRes = await fetch(hlApiUrl + "/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "userNonFundingLedgerUpdates",
          user: minerWallet,
        }),
      });

      if (verifyRes.ok) {
        const updates = await verifyRes.json();
        const now = Date.now();
        const TEN_MINUTES = 10 * 60 * 1000;

        if (Array.isArray(updates)) {
          for (const update of updates) {
            const delta = update.delta;
            if (!delta || delta.type !== "send") continue;
            if (delta.token !== "USDC") continue;

            const updateHash = (update.hash || "").toLowerCase();
            if (updateHash !== normalizedTxHash) continue;

            // Exact hash matched — validate sender, amount, and recency
            const transferSender = (delta.user || "").toLowerCase();
            const transferAmount = Number(delta.amount || delta.usdcValue || 0);
            const isRecent = (now - (update.time || 0)) < TEN_MINUTES;

            // Log if sender differs from hlAddress (cross-wallet payment is allowed)
            if (transferSender !== hlAddress.toLowerCase()) {
              console.info("[register] HL sender differs from hlAddress (cross-wallet payment)", {
                minerSlug,
                txHash: update.hash,
                hlAddress,
                actualSender: transferSender,
                claimedSender: hlTransferSender || "not provided",
              });
            }

            if (Math.abs(transferAmount - effectivePrice) >= 0.01) {
              console.warn("[register] HL amount mismatch on hash match", {
                minerSlug,
                txHash: update.hash,
                expected: effectivePrice,
                actual: transferAmount,
                devTest,
              });
              return NextResponse.json(
                { error: "Transfer amount does not match the expected price." },
                { status: 400 },
              );
            }

            if (!isRecent) {
              console.warn("[register] HL transfer too old", {
                minerSlug,
                txHash: update.hash,
                transferTime: update.time,
              });
              return NextResponse.json(
                { error: "Transfer is too old. Please make a new transfer." },
                { status: 400 },
              );
            }

            transferVerified = true;
            console.info("[register] hyperliquid transfer verified (exact hash)", {
              minerSlug,
              txHash: update.hash,
              transferSender,
              transferAmount,
              transferTime: update.time,
            });
            break;
          }
        }
      }
    } catch (err) {
      console.warn("[register] HL transfer verification error:", err.message);
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
    const { requirements, paymentRequired } = buildPaymentRequirements(
      miner,
      tier,
      request.url,
      devTest ? DEV_TEST_PRICE : undefined,
    );

    const paymentSignatureHeader = request.headers.get("payment-signature");

    if (!paymentSignatureHeader) {
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
    } catch {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    let verifyResult;
    try {
      verifyResult = await facilitator.verify(paymentPayload, requirements);
    } catch (err) {
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
      settleResult = await facilitator.settle(paymentPayload, requirements);
    } catch (err) {
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

  // Upsert user record
  let userId = null;
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
      if (Object.keys(updates).length > 0) {
        await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, existing.id));
      }
    } else {
      const [newUser] = await db
        .insert(users)
        .values({ wallet: effectivePayoutAddress, email, utmCode: affiliateUtm || null })
        .returning({ id: users.id });
      userId = newUser.id;
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
          `[register] No API key for miner slug=${miner.slug}; set entity_miners.api_key or ENTITY_MINER_API_KEY_${miner.slug.replace(/-/g, "_").toUpperCase()}`,
        );
      }
      const baseUrl = miner.apiUrl.replace(/\/+$/, "");
      const res = await postCreateHlSubaccount(
        baseUrl,
        {
          hl_address: hlAddress,
          account_size: accountSize,
          payout_address: effectivePayoutAddress,
        },
        apiKey,
      );
      if (!res.ok && res.status === 401 && apiKey) {
        console.warn(
          `[register] Miner API 401 Unauthorized: key must match an entry in the entity miner's api_keys.json (same string as entity_miners.api_key; from DB=${hadDbKey}, len=${apiKey.length})`,
        );
      }
      if (res.ok) {
        registered = true;
      } else {
        const errText = await res.text().catch(() => "");
        reportError(new Error("Miner API error response"), {
          source: "api/register",
          metadata: { step: "miner_api", apiStatus: res.status },
        });
        statusDetail = { reason: "miner_api_error", error: errText, apiStatus: res.status };
      }
    } catch (err) {
      reportError(err, { source: "api/register", metadata: { step: "miner_api_unreachable" } });
      statusDetail = { reason: "miner_api_unreachable", error: err.message };
    }
  }

  // Insert registration record — this MUST succeed; the user already paid.
  try {
    await db.insert(registrations).values({
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
    });
  } catch (err) {
    reportCritical(err, {
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
        dbError: err?.message,
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

  if (process.env.SMTP_USER) {
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
    } catch {
      // Email send failure is non-blocking
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
