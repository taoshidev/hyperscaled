// Hyperliquid L1 payment — EIP-712 typed signatures
// Supports both usdSend (standard accounts) and spotSend (unified accounts)

import { HL_SIGNING_CHAIN_ID, HL_CHAIN_NAME, HL_API_URL } from "./constants";

// USDC token identifier on Hyperliquid spot
const HL_USDC_TOKEN = "USDC:0x6d1e7cde53ba9467b783cb7c530ce054";

// ── Account abstraction detection ────────────────────────────────────────────

export async function checkUserAbstraction(userAddress) {
  const res = await fetch(`${HL_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "userAbstraction", user: userAddress }),
  });
  if (!res.ok) return "disabled";
  const data = await res.json();
  // Returns "unifiedAccount" | "portfolioMargin" | "disabled" | "default" | "dexAbstraction"
  return typeof data === "string" ? data : "disabled";
}

export function isUnifiedAccount(abstraction) {
  return abstraction === "unifiedAccount" || abstraction === "portfolioMargin";
}

// ── Shared domain (same for both usdSend and spotSend) ──────────────────────

export function buildDomain() {
  return {
    name: "HyperliquidSignTransaction",
    version: "1",
    chainId: HL_SIGNING_CHAIN_ID,
    verifyingContract: "0x0000000000000000000000000000000000000000",
  };
}

// ── usdSend (standard / non-unified accounts) ───────────────────────────────

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

export function buildUsdSendMessage({ amount, destination, timestamp }) {
  return {
    hyperliquidChain: HL_CHAIN_NAME,
    destination,
    amount: String(amount),
    time: timestamp,
  };
}

export async function submitUsdSend({ signature, amount, destination, timestamp }) {
  return submitTransfer({
    actionType: "usdSend",
    signature,
    amount,
    destination,
    timestamp,
  });
}

// ── spotSend (unified / portfolio-margin accounts) ───────────────────────────

export function buildSpotSendTypes() {
  return {
    "HyperliquidTransaction:SpotSend": [
      { name: "hyperliquidChain", type: "string" },
      { name: "destination", type: "string" },
      { name: "token", type: "string" },
      { name: "amount", type: "string" },
      { name: "time", type: "uint64" },
    ],
  };
}

export function buildSpotSendMessage({ amount, destination, timestamp }) {
  return {
    hyperliquidChain: HL_CHAIN_NAME,
    destination,
    token: HL_USDC_TOKEN,
    amount: String(amount),
    time: timestamp,
  };
}

export async function submitSpotSend({ signature, amount, destination, timestamp }) {
  return submitTransfer({
    actionType: "spotSend",
    signature,
    amount,
    destination,
    timestamp,
    token: HL_USDC_TOKEN,
  });
}

// ── Shared submission logic ──────────────────────────────────────────────────

async function submitTransfer({ actionType, signature, amount, destination, timestamp, token }) {
  const r = "0x" + signature.slice(2, 66);
  const s = "0x" + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);

  const signatureChainId = "0x" + HL_SIGNING_CHAIN_ID.toString(16);

  // TODO (Sam/Brian): Backend WebSocket listener required
  // Subscribe to: wss://api.hyperliquid-testnet.xyz/ws (testnet) or wss://api.hyperliquid.xyz/ws (mainnet)
  // Event: userEvents → type: "transfer"
  // Match: destination === RECEIVING_WALLET && amount === expected && timestamp within 60s
  // On match: mark registration paid, provision account

  const action = {
    type: actionType,
    signatureChainId,
    hyperliquidChain: HL_CHAIN_NAME,
    destination,
    amount: String(amount),
    time: timestamp,
  };

  if (token) {
    action.token = token;
  }

  const res = await fetch(`${HL_API_URL}/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
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
