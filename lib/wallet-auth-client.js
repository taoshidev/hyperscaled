"use client";

import { buildSignedMessage } from "./wallet-auth-shared";

/**
 * Build the headers + canonical body bytes for a wallet-signed request.
 *
 * Pops a wallet signature via the caller's `signMessageAsync` (typically
 * wagmi's `useSignMessage().signMessageAsync`) and returns headers ready
 * to spread into a `fetch` call.
 *
 * IMPORTANT: send the returned `body` bytes as-is. Re-stringifying the
 * payload (extra whitespace, key reordering) changes its sha256 and
 * the server will reject the signature.
 *
 * @param {object} args
 * @param {string} args.path             URL pathname only (no query string)
 * @param {string|object|null} args.body Request body. Strings are signed verbatim; objects are JSON.stringify'd. Pass "" or null for GET.
 * @param {string} args.address          The 0x… EOA from wagmi's useAccount()
 * @param {(args: { message: string }) => Promise<string>} args.signMessageAsync
 * @returns {Promise<{ headers: Record<string,string>, body: string }>}
 */
export async function buildSignedHeaders({
  path,
  body,
  address,
  signMessageAsync,
}) {
  if (!address) {
    throw new Error("buildSignedHeaders: wallet address is required");
  }
  if (typeof signMessageAsync !== "function") {
    throw new Error("buildSignedHeaders: signMessageAsync is required");
  }

  const nonce = String(Date.now());
  const bodyText =
    body == null
      ? ""
      : typeof body === "string"
        ? body
        : JSON.stringify(body);

  const message = buildSignedMessage({ path, nonce, body: bodyText });
  const signature = await signMessageAsync({ message });

  return {
    headers: {
      "x-wallet": address,
      "x-signature": signature,
      "x-nonce": nonce,
    },
    body: bodyText,
  };
}
