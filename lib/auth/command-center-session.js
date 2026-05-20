/**
 * HMAC-signed session cookies for the /command-center routes.
 *
 * HttpOnly cookie: `<base64url(payload)>.<base64url(hmac)>`. Payload JSON:
 * `{ wallet, role, exp, secured?: boolean }`. When `COMMAND_CENTER_SECURITY_TOKEN`
 * is set, wallet sign-in issues `secured: false` until `/api/command-center/security-token`
 * verifies the shared token (`secured: true`).
 *
 * Hyperscaled does not run a generic email/session login (vanta-ui's
 * approach), so we reuse the wallet-signing flow already in
 * `lib/wallet-auth.js` for sign-in and persist sessions in this format
 * to avoid pulling in `jose`/`jsonwebtoken`.
 */

import crypto from "node:crypto";

export const COMMAND_CENTER_SESSION_COOKIE = "hs_cc_session";

const DEFAULT_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function toBase64Url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function getSecret() {
  const secret = process.env.COMMAND_CENTER_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "COMMAND_CENTER_SESSION_SECRET must be set to a value of at least 32 characters."
    );
  }
  return secret;
}

function sign(payloadB64) {
  return toBase64Url(
    crypto.createHmac("sha256", getSecret()).update(payloadB64).digest()
  );
}

export function signSessionCookie({
  wallet,
  role,
  ttlSeconds,
  secured = true,
  expiresAtSeconds: expiresAtSecondsOverride,
}) {
  const exp =
    typeof expiresAtSecondsOverride === "number"
      ? expiresAtSecondsOverride
      : Math.floor(Date.now() / 1000) + (ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const payload = JSON.stringify({ wallet, role, exp, secured: !!secured });
  const payloadB64 = toBase64Url(payload);
  const sig = sign(payloadB64);
  return { value: `${payloadB64}.${sig}`, expiresAtSeconds: exp };
}

export function verifySessionCookie(raw) {
  if (!raw || typeof raw !== "string") return null;
  const [payloadB64, sig] = raw.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(payloadB64).toString("utf8"));
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload.wallet !== "string" ||
    typeof payload.role !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

  return {
    wallet: payload.wallet,
    role: payload.role,
    exp: payload.exp,
    secured: payload.secured === true,
  };
}

export function sessionCookieOptions(expiresAtSeconds) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAtSeconds * 1000),
  };
}

export function clearedSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
}
