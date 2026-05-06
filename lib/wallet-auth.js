/**
 * EVM-wallet ownership verification for trader-bound API routes.
 *
 * Headers:
 *   x-wallet:    EOA address (the wallet the request is bound to)
 *   x-signature: hex-encoded EIP-191 signature
 *   x-nonce:     millisecond timestamp used in the signed message
 *
 * The signed message is `${path}:${nonce}:${bodyHash}` where:
 *   - path     = the URL pathname (e.g. "/api/register")
 *   - nonce    = millisecond timestamp (must be within ±5 minutes)
 *   - bodyHash = sha256 hex of the raw request body, or the literal
 *                string "GET" for non-body requests. This binds the
 *                signature to the exact payload — replaying it for a
 *                different subaccount or time range is not possible.
 *
 * Replay protection uses the Postgres-backed nonce store in
 * `lib/nonce-store.js` so the guarantee survives across serverless
 * instances.
 */

import { verifyMessage, isAddress, getAddress } from "viem";

import { consumeNonce } from "./nonce-store.js";
import { buildSignedMessage } from "./wallet-auth-shared.js";

// Re-exported so existing call sites (tests, route handlers, SDKs) keep
// importing it from the canonical server module.
export { buildSignedMessage };

const NONCE_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Lower-level verification taking pre-read inputs. Use this when the
 * route already needed to read the body for its own logic (e.g. to
 * decide whether a signature is required at all).
 *
 * Returns { wallet } on success. Throws on any verification failure.
 */
export async function verifyWalletHeaders({ headers, path, bodyText }) {
  const wallet = headers.wallet;
  const signature = headers.signature;
  const nonce = headers.nonce;

  if (!wallet || !signature || !nonce) {
    throw new Error("Missing authentication headers (x-wallet, x-signature, x-nonce)");
  }
  if (!isAddress(wallet)) {
    throw new Error("Invalid x-wallet address");
  }

  const nonceTs = parseInt(nonce, 10);
  if (isNaN(nonceTs) || Math.abs(Date.now() - nonceTs) > NONCE_MAX_AGE_MS) {
    throw new Error("Nonce expired or invalid");
  }

  const message = buildSignedMessage({ path, nonce, body: bodyText });

  const valid = await verifyMessage({
    address: getAddress(wallet),
    message,
    signature,
  });
  if (!valid) {
    throw new Error("Invalid signature");
  }

  const fresh = await consumeNonce(
    `wallet:${wallet.toLowerCase()}:${nonce}`,
    NONCE_MAX_AGE_MS,
  );
  if (!fresh) {
    throw new Error("Nonce already used");
  }

  return { wallet: getAddress(wallet) };
}

/**
 * Verify wallet ownership headers. The request body is read once and
 * returned to the caller so route handlers do not have to re-parse it.
 *
 * Returns { wallet, body } on success (body is a string — caller can
 * `JSON.parse(body)` if needed). Throws on any verification failure.
 */
export async function verifyWalletSignature(request) {
  const url = new URL(request.url);
  const bodyText = ["GET", "HEAD"].includes(request.method)
    ? ""
    : await request.text();

  const result = await verifyWalletHeaders({
    headers: {
      wallet: request.headers.get("x-wallet"),
      signature: request.headers.get("x-signature"),
      nonce: request.headers.get("x-nonce"),
    },
    path: url.pathname,
    bodyText,
  });

  return { wallet: result.wallet, body: bodyText };
}
