"use client";

import { buildSignedHeaders } from "./wallet-auth-client";
import { truncateAddress } from "./format";

/**
 * Sign `/api/register` (and siblings like `/api/register/preflight`) with the
 * HL trading wallet to prove ownership of the address being registered.
 *
 * The single-wallet path (HL = paying wallet) calls this once with the
 * connected wallet, which must equal `hlAddress`. The dual-wallet path
 * (different paying wallet) calls this earlier, while HL is connected,
 * to capture an ownership bundle that is later replayed when paying
 * from a different wallet — see `step-connect-pay.jsx`.
 *
 * @param {object} args
 * @param {string} args.path             URL pathname of the route being called
 * @param {object|string} args.body      Request body (object → JSON.stringify; string passed through verbatim)
 * @param {string} args.hlAddress        The HL address being registered (must equal connectedAddress at sign time)
 * @param {string|undefined} args.connectedAddress  wagmi useAccount().address at sign time
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
      `Connect ${truncateAddress(hlAddress)} (the Hyperliquid address you're registering) to sign ownership before continuing.`,
    );
  }
  return buildSignedHeaders({
    path,
    body,
    address: connectedAddress,
    signMessageAsync,
  });
}
