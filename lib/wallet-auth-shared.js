import { sha256, toBytes } from "viem";

// viem's sha256 returns "0x..." — strip the prefix to keep parity with the
// previous Node-crypto digest format.
function sha256Hex(input) {
  return sha256(toBytes(input)).slice(2);
}

/**
 * Canonical message format for wallet-bound API routes:
 *   `${path}:${nonce}:${bodyHash}`
 *
 *   - path     = URL pathname only (no query string)
 *   - nonce    = millisecond timestamp string
 *   - bodyHash = sha256 hex of the raw request body, or the literal "GET"
 *
 * Shared between server-side verification (lib/wallet-auth.js) and
 * client-side signing (lib/wallet-auth-client.js) so the formats can't drift.
 * Browser-safe: depends only on viem.
 */
export function buildSignedMessage({ path, nonce, body }) {
  const bodyHash = body && body.length > 0 ? sha256Hex(body) : "GET";
  return `${path}:${nonce}:${bodyHash}`;
}
