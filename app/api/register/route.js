import { NextResponse } from "next/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import {
  encodePaymentRequiredHeader,
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import { getMinerBySlug, getMinerApiUrl, getMinerWalletAddress, TIERS } from "@/lib/miners";
import { isValidHLAddress, isValidEvmAddress } from "@/lib/validation";
import { USDC_ADDRESS, USDC_DECIMALS, USDC_EIP712_NAME, USDC_EIP712_VERSION, BASE_NETWORK, FACILITATOR_URL, BASESCAN_URL } from "@/lib/constants";

const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

function buildPaymentRequirements(miner, tierIndex, requestUrl) {
  const minerWallet = getMinerWalletAddress(miner);
  const price = miner.prices[tierIndex];
  const tier = TIERS[tierIndex];

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
      description: `${miner.name} ${tier.label} Account Registration`,
    },
    minerWallet,
    price,
    tier,
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

  const { minerSlug, hlAddress, accountSize, payoutAddress, email, tierIndex } = body;

  if (!minerSlug || !hlAddress || !accountSize || !email || tierIndex == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const miner = getMinerBySlug(minerSlug);
  if (!miner) {
    return NextResponse.json({ error: "Unknown miner" }, { status: 400 });
  }

  if (!isValidHLAddress(hlAddress)) {
    return NextResponse.json({ error: "Invalid HL address" }, { status: 400 });
  }

  if (payoutAddress && !isValidEvmAddress(payoutAddress)) {
    return NextResponse.json({ error: "Invalid payout address" }, { status: 400 });
  }

  if (tierIndex < 0 || tierIndex >= TIERS.length) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const { requirements, paymentRequired, minerWallet } = buildPaymentRequirements(
    miner,
    tierIndex,
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
    console.log("[x402] Verify result:", JSON.stringify(verifyResult));
  } catch (err) {
    console.error("[x402] Facilitator verify error:", err);
    return NextResponse.json(
      { error: `Payment verification failed: ${err?.message || "unknown error"}` },
      { status: 502 },
    );
  }

  if (!verifyResult?.isValid) {
    console.warn("[x402] Verify invalid:", verifyResult?.invalidReason);
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
    console.log("[x402] Settle result:", JSON.stringify(settleResult));
  } catch (err) {
    console.error("[x402] Facilitator settle error:", err);
    return NextResponse.json(
      {
        error: "Payment settlement failed",
        message: "Your payment was verified but settlement failed. Please contact support.",
      },
      { status: 500 },
    );
  }

  if (!settleResult?.success) {
    console.error("[x402] Settlement unsuccessful:", JSON.stringify(settleResult));
    return NextResponse.json(
      {
        error: "Payment settlement was not successful",
        message: settleResult?.errorReason || settleResult?.errorMessage || "The facilitator could not complete the on-chain transfer. Please try again.",
      },
      { status: 500 },
    );
  }

  const txHash = settleResult?.transaction || "";

  const apiUrl = getMinerApiUrl(miner);
  let registered = false;
  const effectivePayoutAddress = payoutAddress || paymentPayload?.payload?.authorization?.from;

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/create_hl_subaccount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hl_address: hlAddress,
          account_size: accountSize,
          payout_address: effectivePayoutAddress,
        }),
      });
      if (res.ok) {
        registered = true;
      } else {
        console.warn(`[register] Miner API returned ${res.status}:`, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.warn("[register] Miner API unreachable:", err.message);
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Hyperscaled <noreply@hyperscaled.com>",
          to: [email],
          subject: registered
            ? `✓ Registered with ${miner.name}`
            : `⏳ Registration Pending — ${miner.name}`,
          html: registered
            ? registeredEmailHtml(miner, accountSize, hlAddress, effectivePayoutAddress, txHash)
            : pendingEmailHtml(miner, accountSize, hlAddress, effectivePayoutAddress, txHash),
        }),
      });
    } catch {
      // Email send failure is non-blocking
    }
  }

  const responseBody = {
    status: registered ? "registered" : "pending",
    message: registered
      ? "Your trading account has been created."
      : "Your payment is confirmed on-chain. Account setup is in progress — we will follow up via email.",
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
        <div style="font-size: 48px;">✅</div>
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
        <a href="${BASESCAN_URL}/tx/${txHash}" style="color: ${miner.color}; font-size: 14px;">View transaction on BaseScan →</a>
      </div>
      <p style="text-align: center; color: #555; font-size: 12px; margin-top: 32px;">Hyperscaled — The Decentralized Prop Trading Network</p>
    </div>
  `;
}

function pendingEmailHtml(miner, accountSize, hlAddress, payoutAddress, txHash) {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px;">⏳</div>
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
        <p style="color: #eab308; font-size: 14px; margin: 0;">⚠️ Your payment was received but we could not automatically create your account. Our team will set it up manually and notify you once it's ready.</p>
      </div>
      <div style="text-align: center;">
        <a href="${BASESCAN_URL}/tx/${txHash}" style="color: ${miner.color}; font-size: 14px;">View transaction on BaseScan →</a>
      </div>
      <p style="text-align: center; color: #555; font-size: 12px; margin-top: 32px;">Hyperscaled — The Decentralized Prop Trading Network</p>
    </div>
  `;
}
