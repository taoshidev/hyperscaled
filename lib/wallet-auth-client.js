"use client";

import { buildSignedMessage } from "./wallet-auth-shared";

// E2E only — pairs with the server-side E2E_BYPASS_WALLET_AUTH flag.
// The wagmi mock connector has no private key, so we skip signing and
// rely on the server bypass to accept just `x-wallet`.
const E2E_MOCK_WALLET =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_E2E_MOCK_WALLET === "true";

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

  const bodyText =
    body == null
      ? ""
      : typeof body === "string"
        ? body
        : JSON.stringify(body);

  if (E2E_MOCK_WALLET) {
    return {
      headers: { "x-wallet": address },
      body: bodyText,
    };
  }

  if (typeof signMessageAsync !== "function") {
    throw new Error("buildSignedHeaders: signMessageAsync is required");
  }

  const nonce = String(Date.now());
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
