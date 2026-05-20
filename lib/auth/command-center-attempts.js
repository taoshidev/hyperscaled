// Per-IP lockout for /api/command-center/session.
//
// Policy (per the spec):
//   * Failures 1–4: noop (the user is mistyping or fumbling wallets).
//   * Failure 5: lock the key for 10 minutes.
//   * Once a key has been locked at least once, every additional 2 failures
//     re-lock the key for 30 minutes. This is sticky for the lifetime of the
//     entry — a successful sign-in clears it, otherwise the entry expires
//     after STATE_RETENTION_MS of inactivity.
//
// Storage is in-process (a Map). On multi-instance deploys each instance
// keeps its own counters, so an attacker hitting N instances gets N×
// the budget. Move to Redis/Upstash when stricter global limits are needed —
// the existing `lib/rate-limit.js` carries the same caveat.

const PRE_LOCK_LIMIT = 5;
const POST_LOCK_LIMIT = 2;
const PRE_LOCK_DURATION_MS = 10 * 60 * 1000;
const POST_LOCK_DURATION_MS = 30 * 60 * 1000;
const STATE_RETENTION_MS = 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const attempts = new Map();
let lastSweep = 0;

function nowMs() {
  return Date.now();
}

function sweep(now) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, entry] of attempts) {
    const lockActive = entry.lockedUntil != null && entry.lockedUntil > now;
    if (!lockActive && now - entry.lastUpdated > STATE_RETENTION_MS) {
      attempts.delete(k);
    }
  }
}

function getOrCreate(key, now) {
  let entry = attempts.get(key);
  if (!entry) {
    entry = {
      preFails: 0,
      postFails: 0,
      hasBeenLocked: false,
      lockedUntil: null,
      lastUpdated: now,
    };
    attempts.set(key, entry);
  }
  return entry;
}

function expireLockIfDue(entry, now) {
  if (entry.lockedUntil != null && entry.lockedUntil <= now) {
    entry.lockedUntil = null;
    // Reset the post-lock counter so the *next* round needs another
    // POST_LOCK_LIMIT failures to re-lock.
    entry.postFails = 0;
  }
}

/**
 * Returns `{ locked, retryAfterMs }`. `retryAfterMs` is rounded up to the
 * next whole second by callers who turn it into a Retry-After header.
 */
export function checkLockout(key) {
  if (!key) return { locked: false, retryAfterMs: 0 };
  const now = nowMs();
  sweep(now);
  const entry = attempts.get(key);
  if (!entry) return { locked: false, retryAfterMs: 0 };
  expireLockIfDue(entry, now);
  if (entry.lockedUntil != null && entry.lockedUntil > now) {
    return { locked: true, retryAfterMs: entry.lockedUntil - now };
  }
  return { locked: false, retryAfterMs: 0 };
}

export function recordFailure(key) {
  if (!key) return { locked: false, retryAfterMs: 0 };
  const now = nowMs();
  sweep(now);
  const entry = getOrCreate(key, now);
  expireLockIfDue(entry, now);

  if (entry.lockedUntil != null && entry.lockedUntil > now) {
    // Already locked — keep the existing window, don't extend on every probe.
    entry.lastUpdated = now;
    return { locked: true, retryAfterMs: entry.lockedUntil - now };
  }

  if (!entry.hasBeenLocked) {
    entry.preFails += 1;
    if (entry.preFails >= PRE_LOCK_LIMIT) {
      entry.lockedUntil = now + PRE_LOCK_DURATION_MS;
      entry.hasBeenLocked = true;
      entry.preFails = 0;
    }
  } else {
    entry.postFails += 1;
    if (entry.postFails >= POST_LOCK_LIMIT) {
      entry.lockedUntil = now + POST_LOCK_DURATION_MS;
      entry.postFails = 0;
    }
  }

  entry.lastUpdated = now;

  if (entry.lockedUntil != null && entry.lockedUntil > now) {
    return { locked: true, retryAfterMs: entry.lockedUntil - now };
  }
  return { locked: false, retryAfterMs: 0 };
}

export function recordSuccess(key) {
  if (!key) return;
  attempts.delete(key);
}

// Test helpers — not for production code.
export function __resetAttempts() {
  attempts.clear();
  lastSweep = 0;
}

export function __peekAttempts(key) {
  const entry = attempts.get(key);
  if (!entry) return null;
  return { ...entry };
}
