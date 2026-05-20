import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ATTRIBUTION_COOKIE,
  verifyAttributionCookie,
} from "@/lib/auth/attribution-cookie";
import { checkRateLimit, getTrustedClientId } from "@/lib/rate-limit";

const ATTRIBUTION_PROMO_LIMIT = 30;
const ATTRIBUTION_PROMO_WINDOW_MS = 60_000;

export async function GET(request) {
  const trustedIp = getTrustedClientId(request);
  const limiterKey = trustedIp
    ? `attribution-promo:ip:${trustedIp}`
    : "attribution-promo:unknown";
  const rl = await checkRateLimit({
    key: limiterKey,
    limit: ATTRIBUTION_PROMO_LIMIT,
    windowMs: ATTRIBUTION_PROMO_WINDOW_MS,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { promo: null, error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000) || 1),
        },
      },
    );
  }

  let raw;
  try {
    const store = await cookies();
    raw = store.get(ATTRIBUTION_COOKIE)?.value;
  } catch {
    raw = undefined;
  }
  if (!raw) {
    return NextResponse.json({ promo: null });
  }
  const decoded = await verifyAttributionCookie(raw);
  const promo =
    decoded?.promo && String(decoded.promo).trim().length > 0
      ? String(decoded.promo).trim().toUpperCase()
      : null;
  return NextResponse.json({ promo });
}
