import { NextResponse } from "next/server";
import { reportError, reportCritical, SEVERITY } from "@/lib/errors";
import { HTTPFacilitatorClient } from "@x402/core/server";
import {
  encodePaymentRequiredHeader,
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import { getMinerBySlug, getTiersForMiner, TIERS } from "@/lib/miners";
import { isValidHLAddress, isValidEvmAddress } from "@/lib/validation";
import { USDC_ADDRESS, USDC_DECIMALS, USDC_EIP712_NAME, USDC_EIP712_VERSION, BASE_NETWORK, FACILITATOR_URL, BASESCAN_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { users, registrations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { facilitator as cdpFacilitator } from "@coinbase/x402";

const USE_TESTNET = process.env.USE_TESTNET === "true";

const facilitator = USE_TESTNET
  ? new HTTPFacilitatorClient({ url: FACILITATOR_URL })
  : new HTTPFacilitatorClient(cdpFacilitator);

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

function buildPaymentRequirements(miner, tier, requestUrl) {
  const minerWallet = miner.usdcWallet;
  const price = Number(tier.priceUsdc);
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

  const { minerSlug, hlAddress, accountSize, payoutAddress, email, tierIndex, affiliateUtm } = body;

  if (!minerSlug || !hlAddress || !accountSize || !email || tierIndex == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      const msg =
        existing.status === "registered"
          ? "This HL address is already registered with this miner."
          : "A registration for this HL address is already being processed. Please wait for it to complete.";
      return NextResponse.json({ error: msg }, { status: 409 });
    }
  } catch (err) {
    console.error("[register] Duplicate check failed:", err.message);
    // Continue — better to risk a duplicate than block a legitimate registration
  }

  const { requirements, paymentRequired, minerWallet, price } = buildPaymentRequirements(
    miner,
    tier,
    request.url,
  );

  if (!minerWallet) {
    return NextResponse.json({ error: "Miner wallet not configured" }, { status: 500 });
  }

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

  let settleResult;
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

  const txHash = settleResult?.transaction || "";
  const effectivePayoutAddress = payoutAddress || paymentPayload?.payload?.authorization?.from;

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
    reportError(err, { source: "api/register", metadata: { step: "user_upsert" } });
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

  // Insert registration record
  try {
    await db.insert(registrations).values({
      userId,
      minerHotkey: miner.hotkey,
      hlAddress,
      accountSize,
      payoutAddress: effectivePayoutAddress,
      tierIndex,
      priceUsdc: String(price),
      txHash,
      status: registered ? "registered" : "pending",
      statusDetail,
    });
  } catch (err) {
    reportError(err, { source: "api/register", metadata: { step: "registration_insert" } });
  }

  if (process.env.SMTP_USER) {
    try {
      const { sendEmail } = await import("@/lib/email");
      await sendEmail({
        to: email,
        subject: registered
          ? `\u2713 Registered with ${miner.name}`
          : `\u231B Registration Pending \u2014 ${miner.name}`,
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
        <p style="color: #888; font-size: 14px;">Your ${miner.name} trading account is ready</p>
      </div>
      <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px;" cellpadding="8">
          <tr><td style="color: #888;">Firm</td><td style="text-align: right; font-weight: 600;">${miner.name}</td></tr>
          <tr><td style="color: #888;">Account Size</td><td style="text-align: right; font-weight: 600;">$${accountSize.toLocaleString()}</td></tr>
          <tr><td style="color: #888;">HL Wallet</td><td style="text-align: right; font-family: monospace; font-size: 12px;">${hlAddress}</td></tr>
          <tr><td style="color: #888;">Payout Wallet</td><td style="text-align: right; font-family: monospace; font-size: 12px;">${payoutAddress}</td></tr>
        </table>
      </div>
      <div style="text-align: center;">
        <a href="${BASESCAN_URL}/tx/${txHash}" style="color: ${miner.color}; font-size: 14px;">View transaction on BaseScan \u2192</a>
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
        <p style="color: #888; font-size: 14px;">Your payment is confirmed. Account setup with ${miner.name} is in progress.</p>
      </div>
      <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px;" cellpadding="8">
          <tr><td style="color: #888;">Firm</td><td style="text-align: right; font-weight: 600;">${miner.name}</td></tr>
          <tr><td style="color: #888;">Account Size</td><td style="text-align: right; font-weight: 600;">$${accountSize.toLocaleString()}</td></tr>
          <tr><td style="color: #888;">HL Wallet</td><td style="text-align: right; font-family: monospace; font-size: 12px;">${hlAddress}</td></tr>
          <tr><td style="color: #888;">Payout Wallet</td><td style="text-align: right; font-family: monospace; font-size: 12px;">${payoutAddress}</td></tr>
        </table>
      </div>
      <div style="background: #2a2000; border: 1px solid #554400; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #eab308; font-size: 14px; margin: 0;">\u26A0\uFE0F Your payment was received but we could not automatically create your account. Our team will set it up manually and notify you once it's ready.</p>
      </div>
      <div style="text-align: center;">
        <a href="${BASESCAN_URL}/tx/${txHash}" style="color: ${miner.color}; font-size: 14px;">View transaction on BaseScan \u2192</a>
      </div>
      <p style="text-align: center; color: #555; font-size: 12px; margin-top: 32px;">Hyperscaled \u2014 The Decentralized Prop Trading Network</p>
    </div>
  `;
}
