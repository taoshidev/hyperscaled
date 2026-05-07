/**
 * Distributed nonce store for replay protection on signed requests.
 *
 * Backed by Postgres (`auth_nonces` table) so the guarantee survives across
 * Vercel/serverless instances and cold starts. A small in-memory cache is
 * kept as a fast-fail short-circuit for repeats observed by the same instance.
 *
 * `consumeNonce` is the only operation: it atomically inserts a new row,
 * returning `true` if the nonce had not been seen before, `false` if it had.
 */

import { sql } from "drizzle-orm";
import { lt } from "drizzle-orm";
import { getDb } from "./db/index.js";
import { authNonces } from "./db/schema.js";

const localCache = new Map();
let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60 * 1000;

function pruneLocal(now) {
  for (const [key, expiresAtMs] of localCache) {
    if (expiresAtMs <= now) localCache.delete(key);
  }
}

async function pruneRemote(db, now) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  try {
    await db.delete(authNonces).where(lt(authNonces.expiresAt, new Date(now)));
  } catch {
    // best-effort cleanup; surface nothing
  }
}

/**
 * Atomically claim a nonce. Returns `true` when the nonce is fresh (now
 * recorded as used), `false` when it was already consumed.
 *
 * @param {string} key Stable identifier for this signed request, typically
 *   `${hotkey}:${nonce}` or `${address}:${nonce}` so different signers
 *   cannot collide.
 * @param {number} ttlMs How long to remember the nonce, in milliseconds.
 */
export async function consumeNonce(key, ttlMs) {
  const now = Date.now();
  const expiresAtMs = now + ttlMs;

  pruneLocal(now);
  if (localCache.has(key)) return false;

  const db = await getDb();
  await pruneRemote(db, now);

  const expiresAt = new Date(expiresAtMs);

  const inserted = await db
    .insert(authNonces)
    .values({ nonceKey: key, expiresAt })
    .onConflictDoNothing({ target: authNonces.nonceKey })
    .returning({ nonceKey: authNonces.nonceKey });

  if (inserted.length === 0) {
    return false;
  }

  localCache.set(key, expiresAtMs);
  return true;
}

/**
 * Test-only helper. Clears the in-memory cache; production callers should
 * never need this.
 */
export function __resetNonceCache() {
  localCache.clear();
  lastSweepAt = 0;
}

// `sql` is imported above to keep the relation alive for tree-shaking;
// referencing it here avoids an "unused" lint warning while keeping the
// module side-effect-free.
void sql;
