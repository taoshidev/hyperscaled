import { getDb } from "@/lib/db";
import { registrations, entityTiers } from "@/lib/db/schema";
import { sql, and, eq, ne, gt } from "drizzle-orm";
import { getMinerBySlug } from "@/lib/miners";

// Global caps (optional env) — apply platform-wide in addition to any per-tier
// limit on `entity_tiers.max_free_registrations`.
const FREE_CAP_ENV = "REGISTRATION_FREE_MAX";
const PAID_CAP_ENV = "REGISTRATION_PAID_MAX";

export const REGISTRATION_CAP_CODE = {
  FREE: "REGISTRATION_FREE_CAP",
  PAID: "REGISTRATION_PAID_CAP",
};

function parseCap(envName) {
  const raw = process.env[envName];
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim();
  if (trimmed === "") return null;
  const n = parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function getConfiguredCaps() {
  return {
    free: parseCap(FREE_CAP_ENV),
    paid: parseCap(PAID_CAP_ENV),
  };
}

export function tierBucket(priceUsdc) {
  return Number(priceUsdc) > 0 ? "paid" : "free";
}

async function countFreeRegistrations(db) {
  const [row] = await db
    .select({ c: sql`count(*)` })
    .from(registrations)
    .where(
      and(
        eq(registrations.priceUsdc, "0"),
        ne(registrations.status, "failed"),
      ),
    );
  const raw = row?.c;
  const n = typeof raw === "bigint" ? Number(raw) : Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function countPaidRegistrations(db) {
  const [row] = await db
    .select({ c: sql`count(*)` })
    .from(registrations)
    .where(
      and(
        gt(registrations.priceUsdc, "0"),
        eq(registrations.status, "registered"),
      ),
    );
  const raw = row?.c;
  const n = typeof raw === "bigint" ? Number(raw) : Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Free signups for a specific miner + account size (excludes failed). */
async function countFreeRegistrationsForMinerAccount(db, minerHotkey, accountSize) {
  const [row] = await db
    .select({ c: sql`count(*)` })
    .from(registrations)
    .where(
      and(
        eq(registrations.minerHotkey, minerHotkey),
        eq(registrations.accountSize, accountSize),
        eq(registrations.priceUsdc, "0"),
        ne(registrations.status, "failed"),
      ),
    );
  const raw = row?.c;
  const n = typeof raw === "bigint" ? Number(raw) : Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function getMaxFreeRegistrationsForTier(db, minerHotkey, accountSize) {
  const [row] = await db
    .select({ maxFree: entityTiers.maxFreeRegistrations })
    .from(entityTiers)
    .where(
      and(
        eq(entityTiers.hotkey, minerHotkey),
        eq(entityTiers.accountSize, accountSize),
        eq(entityTiers.isActive, true),
      ),
    )
    .limit(1);
  const m = row?.maxFree;
  if (m == null || m === undefined) return null;
  const n = Number(m);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Snapshot for the free tier of one miner when `entity_tiers.max_free_registrations`
 * is set on that free tier row. Returns null if this miner has no per-tier free cap.
 */
async function getMinerTierFreeSnapshot(db, minerHotkey) {
  const tierRows = await db
    .select({
      accountSize: entityTiers.accountSize,
      priceUsdc: entityTiers.priceUsdc,
      maxFree: entityTiers.maxFreeRegistrations,
    })
    .from(entityTiers)
    .where(
      and(eq(entityTiers.hotkey, minerHotkey), eq(entityTiers.isActive, true)),
    );

  const capped = tierRows.find(
    (t) =>
      Number(t.priceUsdc) === 0 &&
      t.maxFree != null &&
      Number.isFinite(Number(t.maxFree)) &&
      Number(t.maxFree) >= 0,
  );
  if (!capped) return null;

  const max = Number(capped.maxFree);
  const current = await countFreeRegistrationsForMinerAccount(
    db,
    minerHotkey,
    capped.accountSize,
  );
  return {
    current,
    max,
    atCapacity: current >= max,
  };
}

function mergeFreeWithGlobal(tierSnap, globalCurrent, globalMax) {
  const globalAt = globalMax != null && globalCurrent >= globalMax;
  if (!tierSnap) {
    return {
      current: globalCurrent,
      max: globalMax,
      atCapacity: globalAt,
      scope: "global",
    };
  }
  return {
    current: tierSnap.current,
    max: tierSnap.max,
    atCapacity: tierSnap.atCapacity || globalAt,
    scope: tierSnap.atCapacity ? "miner_tier" : globalAt ? "global" : "miner_tier",
  };
}

/**
 * Optional `minerSlug`: when set, free-bucket counts use this miner's capped free tier
 * (if configured on `entity_tiers`) so tenant UIs reflect their own limits.
 * Paid bucket remains global.
 */
export async function getRegistrationCapacitySnapshot(options = {}) {
  const minerSlug =
    typeof options.minerSlug === "string" && options.minerSlug.trim()
      ? options.minerSlug.trim()
      : null;

  const db = await getDb();
  const caps = getConfiguredCaps();

  const [freeGlobalCurrent, paidCurrent] = await Promise.all([
    caps.free == null ? Promise.resolve(0) : countFreeRegistrations(db),
    caps.paid == null ? Promise.resolve(0) : countPaidRegistrations(db),
  ]);

  let freeBlock;
  if (minerSlug) {
    const miner = await getMinerBySlug(minerSlug);
    if (miner) {
      const tierSnap = await getMinerTierFreeSnapshot(db, miner.hotkey);
      freeBlock = mergeFreeWithGlobal(
        tierSnap,
        freeGlobalCurrent,
        caps.free,
      );
    }
  }

  if (!freeBlock) {
    freeBlock = {
      current: freeGlobalCurrent,
      max: caps.free,
      atCapacity: caps.free != null && freeGlobalCurrent >= caps.free,
      scope: "global",
    };
  }

  return {
    free: {
      current: freeBlock.current,
      max: freeBlock.max,
      atCapacity: freeBlock.atCapacity,
      ...(freeBlock.scope ? { scope: freeBlock.scope } : {}),
    },
    paid: {
      current: paidCurrent,
      max: caps.paid,
      atCapacity: caps.paid != null && paidCurrent >= caps.paid,
    },
  };
}

/**
 * Server-side gate for /preflight and /api/register.
 * Pass minerHotkey + accountSize so per-tier free caps apply.
 */
export async function checkRegistrationCap(priceUsdc, ctx = {}) {
  const bucket = tierBucket(priceUsdc);
  const caps = getConfiguredCaps();

  if (bucket === "paid") {
    const max = caps.paid;
    if (max == null) return null;
    const db = await getDb();
    const current = await countPaidRegistrations(db);
    if (current < max) return null;
    return {
      code: REGISTRATION_CAP_CODE.PAID,
      error:
        "Registrations are paused while we onboard the current wave. Please join the waitlist for the next opening.",
    };
  }

  // Free: per-tier cap (miner + account size), then global free cap
  const minerHotkey =
    typeof ctx.minerHotkey === "string" ? ctx.minerHotkey : null;
  const accountSize =
    typeof ctx.accountSize === "number" && Number.isFinite(ctx.accountSize)
      ? ctx.accountSize
      : null;

  if (minerHotkey && accountSize != null) {
    const db = await getDb();
    const tierMax = await getMaxFreeRegistrationsForTier(
      db,
      minerHotkey,
      accountSize,
    );
    if (tierMax != null) {
      const used = await countFreeRegistrationsForMinerAccount(
        db,
        minerHotkey,
        accountSize,
      );
      if (used >= tierMax) {
        return {
          code: REGISTRATION_CAP_CODE.FREE,
          error:
            "Free challenge accounts are full right now. Please join the waitlist or choose a paid tier.",
        };
      }
    }
  }

  const maxGlobal = caps.free;
  if (maxGlobal == null) return null;

  const db = await getDb();
  const globalUsed = await countFreeRegistrations(db);
  if (globalUsed < maxGlobal) return null;

  return {
    code: REGISTRATION_CAP_CODE.FREE,
    error:
      "Free challenge accounts are full right now. Please join the waitlist or choose a paid tier.",
  };
}
