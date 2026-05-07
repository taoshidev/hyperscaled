"use client";

import { buildSignedHeaders } from "./wallet-auth-client";
import { truncateAddress } from "./format";

/**
 * Build wallet-signed headers for `/api/register` (and `/api/register/preflight`,
 * `/api/testnet-register`, etc.) calls.
 *
 * Enforces Option B's contract: the connected wallet MUST equal the
 * `hlAddress` being registered. Otherwise we can't prove the user owns
 * the HL address they're claiming. We surface that as a thrown Error
 * with a user-facing message ("Switch MetaMask to 0x…") rather than
 * silently calling signMessageAsync — the wallet popup would fail with
 * a confusing "wrong signer" error from the server otherwise.
 *
 * @param {object} args
 * @param {string} args.path             URL pathname of the route being called
 * @param {object|string} args.body      Request body (object → JSON.stringify; string passed through verbatim)
 * @param {string} args.hlAddress        The HL address being registered (must equal connectedAddress)
 * @param {string|undefined} args.connectedAddress  wagmi useAccount().address
 * @param {(args: { message: string }) => Promise<string>} args.signMessageAsync
 *   wagmi useSignMessage().signMessageAsync
 * @returns {Promise<{ headers: Record<string,string>, body: string }>}
 */
export async function signRegistrationRequest({
  path = "/api/register",
  body,
  hlAddress,
  connectedAddress,
  signMessageAsync,
}) {
  if (!connectedAddress) {
    throw new Error("Connect your wallet to continue.");
  }
  if (!hlAddress) {
    throw new Error("Enter your Hyperliquid wallet address.");
  }
  if (connectedAddress.toLowerCase() !== hlAddress.toLowerCase()) {
    throw new Error(
      `Switch MetaMask to ${truncateAddress(hlAddress)} (the HL address you're registering) before continuing.`,
    );
  }
  return buildSignedHeaders({
    path,
    body,
    address: connectedAddress,
    signMessageAsync,
  });
}
