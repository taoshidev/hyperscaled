import { signatureVerify } from "@polkadot/util-crypto";
import { stringToU8a } from "@polkadot/util";

const NONCE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const seenNonces = new Map(); // nonce → expiry timestamp

function cleanExpiredNonces() {
  const now = Date.now();
  for (const [key, expiry] of seenNonces) {
    if (now > expiry) seenNonces.delete(key);
  }
}

/**
 * Verify an SS58 signature from request headers.
 *
 * Protocol: Client signs "{hotkey}:{nonce}:{method}:{path}" with their
 * SS58 private key, then sends:
 *   x-hotkey:    SS58 public address
 *   x-signature: hex-encoded signature
 *   x-nonce:     nonce used in the signed message
 *
 * Returns { hotkey } on success, or throws with a descriptive message.
 */
export async function verifyHotkeySignature(request) {
  const hotkey = request.headers.get("x-hotkey");
  const signature = request.headers.get("x-signature");
  const nonce = request.headers.get("x-nonce");

  if (!hotkey || !signature || !nonce) {
    throw new Error("Missing authentication headers (x-hotkey, x-signature, x-nonce)");
  }

  // Nonce freshness: expect nonce to be (or start with) a millisecond timestamp
  const nonceTs = parseInt(nonce, 10);
  if (isNaN(nonceTs) || Math.abs(Date.now() - nonceTs) > NONCE_MAX_AGE_MS) {
    throw new Error("Nonce expired or invalid");
  }

  // Replay prevention
  cleanExpiredNonces();
  const nonceKey = `${hotkey}:${nonce}`;
  if (seenNonces.has(nonceKey)) {
    throw new Error("Nonce already used");
  }

  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  const message = `${hotkey}:${nonce}:${method}:${path}`;
  const messageU8a = stringToU8a(message);

  const result = signatureVerify(messageU8a, signature, hotkey);

  if (!result.isValid) {
    throw new Error("Invalid signature");
  }

  // Mark nonce as used only after successful verification
  seenNonces.set(nonceKey, Date.now() + NONCE_MAX_AGE_MS);

  return { hotkey };
}
