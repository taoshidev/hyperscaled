import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { affiliates, entityMiners, referralClicks } from "@/lib/db/schema";
import { checkRateLimit, getTrustedClientId } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TRACK_CLICK_LIMIT = 60;
const TRACK_CLICK_WINDOW_MS = 60_000;

// Collapse repeat landings from a single user action into one click. The
// proxy mints a fresh clickId on every middleware invocation, and one
// navigation can replay the landing more than once (dev double-invocation,
// brand-domain redirects that re-run middleware, prefetch/RSC races, and
// multi-instance burst-guard misses). Without this, a single page load can
// record several clicks and over-count the affiliate's useCount. The window
// is deliberately short so a deliberate revisit seconds later still counts.
const CLICK_DEDUPE_WINDOW_MS = 10_000;

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

  const ipHash = hashIp(clientIp(request));
  const landing = clamp(landingPath, 1024);

  // A single navigation can fire this endpoint more than once, and those
  // fires arrive concurrently (the proxy posts fire-and-forget). A plain
  // "select then insert" races — both probes miss before either commits, so
  // both insert. We serialize identical clicks with a transaction-scoped
  // advisory lock keyed on the natural identity, then dedupe inside the lock.
  // Only the first request in the window records a row and bumps the counter.
  const dedupeKey = [
    "track-click",
    affiliateId ?? "",
    entityMinerHotkey ?? "",
    ipHash ?? "",
    landing,
  ].join("|");

  try {
    const recorded = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${dedupeKey}))`);

      const since = new Date(Date.now() - CLICK_DEDUPE_WINDOW_MS);
      const [recent] = await tx
        .select({ id: referralClicks.id })
        .from(referralClicks)
        .where(
          and(
            gt(referralClicks.occurredAt, since),
            eq(referralClicks.landingPath, landing),
            affiliateId != null
              ? eq(referralClicks.affiliateId, affiliateId)
              : isNull(referralClicks.affiliateId),
            entityMinerHotkey != null
              ? eq(referralClicks.entityMinerHotkey, entityMinerHotkey)
              : isNull(referralClicks.entityMinerHotkey),
            ipHash != null
              ? eq(referralClicks.ipHash, ipHash)
              : isNull(referralClicks.ipHash),
          ),
        )
        .limit(1);
      if (recent) return false;

      await tx
        .insert(referralClicks)
        .values({
          clickId,
          affiliateId,
          entityMinerHotkey,
          promoCode:
            typeof promo === "string" && promo ? promo.toUpperCase() : null,
          landingPath: landing,
          referrer: clamp(body?.referrer ?? null, 1024),
          userAgent: clamp(body?.userAgent ?? null, 512),
          ipHash,
        })
        .onConflictDoNothing({ target: referralClicks.clickId });

      if (affiliateId) {
        // Atomic increment so concurrent clicks for different affiliates
        // don't lose updates. Kept inside the lock/txn so the counter stays
        // in lockstep with the referral_clicks row we just wrote.
        await tx
          .update(affiliates)
          .set({ useCount: sql`${affiliates.useCount} + 1` })
          .where(eq(affiliates.id, affiliateId));
      }
      return true;
    });

    return NextResponse.json(
      { ok: true, deduped: !recorded },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 200 },
    );
  }
}
