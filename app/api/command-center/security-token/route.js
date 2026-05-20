import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getStaffByWallet } from "@/lib/auth/command-center.js";
import {
  COMMAND_CENTER_SESSION_COOKIE,
  signSessionCookie,
  sessionCookieOptions,
  verifySessionCookie,
} from "@/lib/auth/command-center-session.js";
import {
  commandCenterSecurityTokenConfigured,
  securityTokenMatches,
} from "@/lib/auth/command-center-security.js";
import { checkRateLimit, getTrustedClientId } from "@/lib/rate-limit.js";
import {
  checkLockout,
  recordFailure,
  recordSuccess,
} from "@/lib/auth/command-center-attempts.js";

function attemptKey(request) {
  const ip = getTrustedClientId(request);
  return ip ? `cc-token:${ip}` : "cc-token:unknown";
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

export async function POST(request) {
  if (!commandCenterSecurityTokenConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  const key = attemptKey(request);
  const lock = checkLockout(key);
  if (lock.locked) return lockedResponse(lock.retryAfterMs);

  const rl = await checkRateLimit({
    key: `cc-token-rl:${key}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    const seconds = Math.max(1, Math.ceil(rl.retryAfterMs / 1000));
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(seconds) } }
    );
  }

  const store = await cookies();
  const raw = store.get(COMMAND_CENTER_SESSION_COOKIE)?.value;
  const session = verifySessionCookie(raw);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await getStaffByWallet(session.wallet);
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.secured === true) {
    return NextResponse.json({
      ok: true,
      redirectTo: "/command-center/promo-codes",
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body?.token ?? body?.securityToken;
  if (typeof token !== "string" || !token.trim()) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  if (!securityTokenMatches(token)) {
    const after = recordFailure(key);
    if (after.locked) return lockedResponse(after.retryAfterMs);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  recordSuccess(key);

  const { value, expiresAtSeconds } = signSessionCookie({
    wallet: staff.wallet,
    role: staff.role,
    secured: true,
    expiresAtSeconds: session.exp,
  });

  store.set(COMMAND_CENTER_SESSION_COOKIE, value, sessionCookieOptions(expiresAtSeconds));

  return NextResponse.json({
    ok: true,
    redirectTo: "/command-center/promo-codes",
  });
}
