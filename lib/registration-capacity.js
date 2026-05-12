import { getDb } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { sql, and, eq, ne, gt } from "drizzle-orm";

// Phased onboarding caps. Each cap is independently optional — leave the env
// var unset (or empty) to disable enforcement for that bucket. Numbers are
// global across all miners; if you ever need per-`miner_hotkey` caps split
// the WHERE clause in `getRegistrationCapacitySnapshot` below.
//
// Counting rules mirror vanta-ui:
//   - Free  → COUNT(*) where price_usdc = 0 AND status <> 'failed'
//             (includes pending + registered so an in-flight free signup
//             still consumes a slot, matching vanta's `countFreeEvaluationAccounts`).
//   - Paid  → COUNT(*) where price_usdc > 0 AND status = 'registered'
//             (only completed paid signups consume a slot — chosen explicitly
//             over distinct-hl-address so retries/re-registrations after a
//             confirmed deregistration are counted as new sales).
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

// Determine whether a registration attempt is "free" or "paid" based on the
// resolved tier price. Server-side callers should use the canonical
// `Number(tier.priceUsdc)` from the DB rather than trusting client input.
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

// Returns { free, paid } where each side has { current, max, atCapacity }.
// `max` is `null` when the cap is unset (no enforcement). `atCapacity` is
// always `false` when `max` is `null`.
export async function getRegistrationCapacitySnapshot() {
  const db = await getDb();
  const caps = getConfiguredCaps();

  const [freeCurrent, paidCurrent] = await Promise.all([
    caps.free == null ? Promise.resolve(0) : countFreeRegistrations(db),
    caps.paid == null ? Promise.resolve(0) : countPaidRegistrations(db),
  ]);

  return {
    free: {
      current: freeCurrent,
      max: caps.free,
      atCapacity: caps.free != null && freeCurrent >= caps.free,
    },
    paid: {
      current: paidCurrent,
      max: caps.paid,
      atCapacity: caps.paid != null && paidCurrent >= caps.paid,
    },
  };
}

// Convenience for server-side enforcement: pass the resolved tier price and
// get back the cap response (or null if allowed). Keeps preflight + register
// in lockstep without each route re-implementing the bucket logic.
export async function checkRegistrationCap(priceUsdc) {
  const bucket = tierBucket(priceUsdc);
  const caps = getConfiguredCaps();
  const max = caps[bucket];
  if (max == null) return null;

  const db = await getDb();
  const current = bucket === "free"
    ? await countFreeRegistrations(db)
    : await countPaidRegistrations(db);

  if (current < max) return null;

  if (bucket === "free") {
    return {
      code: REGISTRATION_CAP_CODE.FREE,
      error:
        "Free challenge accounts are full right now. Please join the waitlist or choose a paid tier.",
    };
  }
  return {
    code: REGISTRATION_CAP_CODE.PAID,
    error:
      "Registrations are paused while we onboard the current wave. Please join the waitlist for the next opening.",
  };
}
