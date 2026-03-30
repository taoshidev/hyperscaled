import { signatureVerify } from "@polkadot/util-crypto";
import { stringToU8a } from "@polkadot/util";

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

  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;

  const message = `${hotkey}:${nonce}:${method}:${path}`;
  const messageU8a = stringToU8a(message);

  const result = signatureVerify(messageU8a, signature, hotkey);

  if (!result.isValid) {
    throw new Error("Invalid signature");
  }

  return { hotkey };
}
