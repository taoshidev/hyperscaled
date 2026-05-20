import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { affiliates, entityMiners, referralClicks } from "@/lib/db/schema";
import { checkRateLimit, getTrustedClientId } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TRACK_CLICK_LIMIT = 60;
const TRACK_CLICK_WINDOW_MS = 60_000;

function hashIp(ip) {
  if (!ip) return null;
  const salt = process.env.ATTRIBUTION_IP_SALT;
  if (!salt || salt.length < 16) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[track/click] ATTRIBUTION_IP_SALT missing or too short — skipping IP hash",
      );
      return null;
    }
    return crypto
      .createHmac("sha256", salt || "hs-attr-dev")
      .update(String(ip))
      .digest("hex")
      .slice(0, 32);
  }
  return crypto
    .createHmac("sha256", salt)
    .update(String(ip))
    .digest("hex")
    .slice(0, 32);
}

function clientIp(request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    null
  );
}

function clamp(value, max) {
  if (value == null) return null;
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
}

function isValidUuid(value) {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(request) {
  const trustedIp = getTrustedClientId(request);
  const limiterKey = trustedIp
    ? `track-click:ip:${trustedIp}`
    : "track-click:unknown";
  const rl = await checkRateLimit({
    key: limiterKey,
    limit: TRACK_CLICK_LIMIT,
    windowMs: TRACK_CLICK_WINDOW_MS,
  });
  if (!rl.ok) {
    // 200 not 429 — the proxy fires-and-forgets, so we silently drop the
    // overage rather than surface a server error to the visitor.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { clickId, affiliate, tenant, promo, landingPath } = body || {};

  // Malformed click: never blocks the user, but also never inserts garbage rows.
  if (!isValidUuid(clickId) || typeof landingPath !== "string" || !landingPath) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  let db;
  try {
    db = await getDb();
  } catch {
    // DB unreachable — drop the click silently. The signed cookie still
    // carries the attribution forward to signup.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  let affiliateId = null;
  if (typeof affiliate === "string" && affiliate) {
    try {
      const [row] = await db
        .select({ id: affiliates.id })
        .from(affiliates)
        .where(eq(affiliates.slug, affiliate.toLowerCase()))
        .limit(1);
      if (row) affiliateId = row.id;
    } catch {
      // ignore
    }
  }

  let entityMinerHotkey = null;
  if (typeof tenant === "string" && tenant) {
    try {
      const [row] = await db
        .select({ hotkey: entityMiners.hotkey })
        .from(entityMiners)
        .where(eq(entityMiners.slug, tenant.toLowerCase()))
        .limit(1);
      if (row) entityMinerHotkey = row.hotkey;
    } catch {
      // ignore
    }
  }

  try {
    await db
      .insert(referralClicks)
      .values({
        clickId,
        affiliateId,
        entityMinerHotkey,
        promoCode:
          typeof promo === "string" && promo ? promo.toUpperCase() : null,
        landingPath: clamp(landingPath, 1024),
        referrer: clamp(body?.referrer ?? null, 1024),
        userAgent: clamp(body?.userAgent ?? null, 512),
        ipHash: hashIp(clientIp(request)),
      })
      .onConflictDoNothing({ target: referralClicks.clickId });

    if (affiliateId) {
      // Atomic increment so concurrent clicks don't lose updates. Failures
      // are non-fatal — the click row is the source of truth for reporting.
      try {
        await db
          .update(affiliates)
          .set({ useCount: sql`${affiliates.useCount} + 1` })
          .where(eq(affiliates.id, affiliateId));
      } catch {
        // ignore
      }
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
