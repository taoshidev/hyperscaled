import {
  HL_API_URL,
  HL_CHAIN_NAME,
  HL_SIGNING_CHAIN_ID,
  HYPERSCALED_BUILDER_ADDRESS,
} from "@/lib/constants";

const DEFAULT_FEE_RATE = "0.05%";

export function isBuilderFeeConfigured() {
  return Boolean(HYPERSCALED_BUILDER_ADDRESS);
}

export async function getCurrentBuilderFee(user) {
  if (!user) return 0;
  if (!HYPERSCALED_BUILDER_ADDRESS) return 0;
  const res = await fetch(`${HL_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "maxBuilderFee",
      user,
      builder: HYPERSCALED_BUILDER_ADDRESS,
    }),
  });
  if (!res.ok) throw new Error(`maxBuilderFee query failed: ${res.status}`);
  const body = await res.json();
  const tenthsBp = Number(body ?? 0);
  return Number.isFinite(tenthsBp) && tenthsBp > 0 ? tenthsBp : 0;
}

/**
 * Ensures the connected wallet has approved the Hyperscaled builder fee on
 * Hyperliquid. Skips signing if an approval already exists for this user+builder.
 * Handles the Arbitrum chain switch internally but does not switch back —
 * callers that need a different chain afterwards are responsible for switching.
 */
export async function ensureBuilderFeeApproved({
  address,
  chainId,
  switchChainAsync,
  feeRate = DEFAULT_FEE_RATE,
}) {
  if (!HYPERSCALED_BUILDER_ADDRESS) {
    // Builder code not configured in this environment — nothing to sign.
    return { skipped: true, reason: "not_configured" };
  }
  if (!address) throw new Error("No connected wallet for builder-fee approval.");

  const existing = await getCurrentBuilderFee(address).catch(() => 0);
  if (existing > 0) {
    return { skipped: true, existing };
  }

  if (chainId !== HL_SIGNING_CHAIN_ID) {
    try {
      await switchChainAsync({ chainId: HL_SIGNING_CHAIN_ID });
    } catch (err) {
      const msg = err?.message || "";
      if (
        msg.includes("not supported") ||
        msg.includes("Unrecognized chain") ||
        msg.includes("unknown chain") ||
        msg.includes("addEthereumChain") ||
        err?.code === 4902
      ) {
        throw new Error(
          "Your wallet doesn't support Arbitrum. Please switch to a wallet that supports Arbitrum (e.g. MetaMask, Rabby, or Coinbase Wallet).",
        );
      }
      throw err;
    }
  }

  const { getWalletClient } = await import("wagmi/actions");
  const { wagmiConfig } = await import("@/lib/wagmi");
  const freshClient = await getWalletClient(wagmiConfig, {
    chainId: HL_SIGNING_CHAIN_ID,
  });

  const nonce = Date.now();
  const signature = await freshClient.signTypedData({
    domain: {
      name: "HyperliquidSignTransaction",
      version: "1",
      chainId: HL_SIGNING_CHAIN_ID,
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    types: {
      "HyperliquidTransaction:ApproveBuilderFee": [
        { name: "hyperliquidChain", type: "string" },
        { name: "maxFeeRate", type: "string" },
        { name: "builder", type: "address" },
        { name: "nonce", type: "uint64" },
      ],
    },
    primaryType: "HyperliquidTransaction:ApproveBuilderFee",
    message: {
      hyperliquidChain: HL_CHAIN_NAME,
      maxFeeRate: feeRate,
      builder: HYPERSCALED_BUILDER_ADDRESS,
      nonce,
    },
  });

  const r = "0x" + signature.slice(2, 66);
  const s = "0x" + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);

  const exchangeRes = await fetch(`${HL_API_URL}/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: {
        type: "approveBuilderFee",
        signatureChainId: "0x" + HL_SIGNING_CHAIN_ID.toString(16),
        hyperliquidChain: HL_CHAIN_NAME,
        maxFeeRate: feeRate,
        builder: HYPERSCALED_BUILDER_ADDRESS,
        nonce,
      },
      nonce,
      signature: { r, s, v },
    }),
  });

  if (!exchangeRes.ok) {
    const data = await exchangeRes.json().catch(() => ({}));
    throw new Error(
      data.error || data.message || "Hyperliquid rejected the builder-fee approval.",
    );
  }

  const result = await exchangeRes.json();
  if (result.status !== "ok") {
    throw new Error(
      typeof result.response === "string"
        ? result.response
        : "Hyperliquid rejected the builder-fee approval.",
    );
  }

  return { skipped: false };
}
