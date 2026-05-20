import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAddress, getAddress, verifyMessage } from "viem";

import { consumeNonce } from "@/lib/nonce-store.js";
import { buildSignedMessage } from "@/lib/wallet-auth-shared.js";
import { getStaffByWallet } from "@/lib/auth/command-center.js";
import {
  COMMAND_CENTER_SESSION_COOKIE,
  signSessionCookie,
  sessionCookieOptions,
  clearedSessionCookieOptions,
} from "@/lib/auth/command-center-session.js";
import { getTrustedClientId } from "@/lib/rate-limit.js";
import {
  checkLockout,
  recordFailure,
  recordSuccess,
} from "@/lib/auth/command-center-attempts.js";
import { commandCenterSecurityTokenConfigured } from "@/lib/auth/command-center-security.js";

const NONCE_MAX_AGE_MS = 5 * 60 * 1000;
const SESSION_PATH = "/api/command-center/session";

const UNAUTHORIZED_MESSAGE = "Unauthorized — access blocked.";

function attemptKey(request) {
  const ip = getTrustedClientId(request);
  return ip ? `cc-login:${ip}` : "cc-login:unknown";
}

function lockedResponse(retryAfterMs) {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return NextResponse.json(
    {
      error: "locked_out",
      retryAfterSeconds: seconds,
      message: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    },
    { status: 429, headers: { "Retry-After": String(seconds) } }
  );
}

function unauthorizedResponse() {
  return NextResponse.json({ error: UNAUTHORIZED_MESSAGE }, { status: 401 });
}

export async function POST(request) {
  const key = attemptKey(request);

  const lock = checkLockout(key);
  if (lock.locked) return lockedResponse(lock.retryAfterMs);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { wallet, signature, nonce } = body || {};
  if (!wallet || !signature || !nonce) {
    return NextResponse.json(
      { error: "Missing wallet, signature, or nonce" },
      { status: 400 }
    );
  }
  if (!isAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const nonceTs = parseInt(nonce, 10);
  if (Number.isNaN(nonceTs) || Math.abs(Date.now() - nonceTs) > NONCE_MAX_AGE_MS) {
    return NextResponse.json({ error: "Nonce expired or invalid" }, { status: 400 });
  }

  const checksummed = getAddress(wallet);
  const message = buildSignedMessage({
    path: SESSION_PATH,
    nonce: String(nonce),
    body: "",
  });

  const valid = await verifyMessage({ address: checksummed, message, signature });
  if (!valid) {
    const after = recordFailure(key);
    if (after.locked) return lockedResponse(after.retryAfterMs);
    return unauthorizedResponse();
  }

  const fresh = await consumeNonce(
    `cc-session:${checksummed.toLowerCase()}:${nonce}`,
    NONCE_MAX_AGE_MS
  );
  if (!fresh) {
    const after = recordFailure(key);
    if (after.locked) return lockedResponse(after.retryAfterMs);
    return unauthorizedResponse();
  }

  const staff = await getStaffByWallet(checksummed);
  if (!staff) {
    const after = recordFailure(key);
    if (after.locked) return lockedResponse(after.retryAfterMs);
    return unauthorizedResponse();
  }

  recordSuccess(key);

  const needsSecurityToken = commandCenterSecurityTokenConfigured();
  const { value, expiresAtSeconds } = signSessionCookie({
    wallet: staff.wallet,
    role: staff.role,
    secured: !needsSecurityToken,
  });

  const store = await cookies();
  store.set(COMMAND_CENTER_SESSION_COOKIE, value, sessionCookieOptions(expiresAtSeconds));

  return NextResponse.json({
    ok: true,
    role: staff.role,
    needsSecurityToken,
    redirectTo: needsSecurityToken
      ? "/command-center/security-token"
      : "/command-center/promo-codes",
  });
}

export async function DELETE() {
  const store = await cookies();
  store.set(COMMAND_CENTER_SESSION_COOKIE, "", clearedSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
