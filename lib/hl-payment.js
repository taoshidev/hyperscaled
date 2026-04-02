// Hyperliquid L1 usdSend — EIP-712 typed signature
// Transfers USDC from user's trading (perps) account to our receiving wallet

import { HL_SIGNING_CHAIN_ID, HL_CHAIN_NAME, HL_API_URL } from "./constants";

export function buildUsdSendTypes() {
  return {
    "HyperliquidTransaction:UsdSend": [
      { name: "hyperliquidChain", type: "string" },
      { name: "destination", type: "string" },
      { name: "amount", type: "string" },
      { name: "time", type: "uint64" },
    ],
  };
}

export function buildUsdSendDomain() {
  return {
    name: "HyperliquidSignTransaction",
    version: "1",
    chainId: HL_SIGNING_CHAIN_ID,
    verifyingContract: "0x0000000000000000000000000000000000000000",
  };
}

export function buildUsdSendMessage({ amount, destination, timestamp }) {
  return {
    hyperliquidChain: HL_CHAIN_NAME,
    destination,
    amount: String(amount),
    time: timestamp,
  };
}

export async function submitUsdSend({ signature, amount, destination, timestamp }) {
  const r = "0x" + signature.slice(2, 66);
  const s = "0x" + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);

  const signatureChainId = "0x" + HL_SIGNING_CHAIN_ID.toString(16);

  // TODO (Sam/Brian): Backend WebSocket listener required
  // Subscribe to: wss://api.hyperliquid-testnet.xyz/ws (testnet) or wss://api.hyperliquid.xyz/ws (mainnet)
  // Event: userEvents → type: "transfer"
  // Match: destination === RECEIVING_WALLET && amount === expected && timestamp within 60s
  // On match: mark registration paid, provision account

  const res = await fetch(`${HL_API_URL}/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: {
        type: "usdSend",
        signatureChainId,
        hyperliquidChain: HL_CHAIN_NAME,
        destination,
        amount: String(amount),
        time: timestamp,
      },
      nonce: timestamp,
      signature: { r, s, v },
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Hyperliquid transfer failed.");
  }

  const result = await res.json();

  // HL exchange returns 200 even on failure — check the status field
  if (result.status !== "ok") {
    throw new Error(
      typeof result.response === "string"
        ? result.response
        : "Hyperliquid transfer failed.",
    );
  }

  return result;
}
