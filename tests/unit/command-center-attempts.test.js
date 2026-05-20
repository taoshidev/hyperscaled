/**
 * Tests for `lib/auth/command-center-attempts.js` — the per-IP failed-login
 * tracker that gates /api/command-center/session.
 *
 * Policy under test:
 *   * Failures 1–4: not locked.
 *   * Failure 5: 10-minute lockout.
 *   * After the first lockout expires, every additional 2 failures locks
 *     the key for 30 minutes (sticky for the entry's lifetime).
 *   * recordSuccess clears the entry entirely.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __peekAttempts,
  __resetAttempts,
  checkLockout,
  recordFailure,
  recordSuccess,
} from "@/lib/auth/command-center-attempts.js";

const TEN_MIN_MS = 10 * 60 * 1000;
const THIRTY_MIN_MS = 30 * 60 * 1000;

beforeEach(() => {
  __resetAttempts();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  __resetAttempts();
});

describe("checkLockout", () => {
  it("returns not-locked for an unknown key", () => {
    const r = checkLockout("nope");
    expect(r.locked).toBe(false);
    expect(r.retryAfterMs).toBe(0);
  });

  it("returns not-locked for a key with fewer than 5 failures", () => {
    for (let i = 0; i < 4; i++) recordFailure("k");
    expect(checkLockout("k").locked).toBe(false);
  });

  it("ignores empty / falsy keys without throwing", () => {
    expect(checkLockout("").locked).toBe(false);
    expect(checkLockout(null).locked).toBe(false);
    expect(recordFailure("").locked).toBe(false);
    recordSuccess("");
  });
});

describe("recordFailure — pre-lockout phase", () => {
  it("locks the key for 10 minutes on the 5th failure", () => {
    for (let i = 0; i < 4; i++) {
      const r = recordFailure("k");
      expect(r.locked).toBe(false);
    }
    const fifth = recordFailure("k");
    expect(fifth.locked).toBe(true);
    expect(fifth.retryAfterMs).toBeGreaterThan(TEN_MIN_MS - 1000);
    expect(fifth.retryAfterMs).toBeLessThanOrEqual(TEN_MIN_MS);
  });

  it("a 6th failure during the lock does not extend the window", () => {
    for (let i = 0; i < 5; i++) recordFailure("k");
    const lockedAt = __peekAttempts("k").lockedUntil;
    vi.advanceTimersByTime(60_000);
    const probe = recordFailure("k");
    expect(probe.locked).toBe(true);
    expect(__peekAttempts("k").lockedUntil).toBe(lockedAt);
  });
});

describe("post-lockout phase (every 2 failures → 30 min)", () => {
  function trip10MinLockoutAndExpire() {
    for (let i = 0; i < 5; i++) recordFailure("k");
    expect(checkLockout("k").locked).toBe(true);
    vi.advanceTimersByTime(TEN_MIN_MS + 1);
    expect(checkLockout("k").locked).toBe(false);
  }

  it("locks for 30 minutes on the 2nd post-lockout failure", () => {
    trip10MinLockoutAndExpire();
    const first = recordFailure("k");
    expect(first.locked).toBe(false);
    const second = recordFailure("k");
    expect(second.locked).toBe(true);
    expect(second.retryAfterMs).toBeGreaterThan(THIRTY_MIN_MS - 1000);
    expect(second.retryAfterMs).toBeLessThanOrEqual(THIRTY_MIN_MS);
  });

  it("re-locks for another 30 minutes after each subsequent pair", () => {
    trip10MinLockoutAndExpire();

    // 2 fails → 30 min lock
    recordFailure("k");
    recordFailure("k");
    expect(checkLockout("k").locked).toBe(true);
    vi.advanceTimersByTime(THIRTY_MIN_MS + 1);
    expect(checkLockout("k").locked).toBe(false);

    // Another 2 fails → another 30 min lock
    recordFailure("k");
    const reLocked = recordFailure("k");
    expect(reLocked.locked).toBe(true);
    expect(reLocked.retryAfterMs).toBeGreaterThan(THIRTY_MIN_MS - 1000);
  });

  it("a single isolated failure post-lockout does NOT relock", () => {
    trip10MinLockoutAndExpire();
    const r = recordFailure("k");
    expect(r.locked).toBe(false);
  });
});

describe("recordSuccess", () => {
  it("clears all counters and lockout state", () => {
    for (let i = 0; i < 5; i++) recordFailure("k");
    expect(checkLockout("k").locked).toBe(true);
    vi.advanceTimersByTime(TEN_MIN_MS + 1);
    expect(checkLockout("k").locked).toBe(false);
    // We're now in post-lockout mode — one more failure is "armed".
    recordFailure("k");
    recordSuccess("k");
    // After success the entry should be gone — fresh budget of 5.
    for (let i = 0; i < 4; i++) {
      expect(recordFailure("k").locked).toBe(false);
    }
    expect(recordFailure("k").locked).toBe(true);
  });
});

describe("isolation by key", () => {
  it("locking one IP does not lock another", () => {
    for (let i = 0; i < 5; i++) recordFailure("ip-a");
    expect(checkLockout("ip-a").locked).toBe(true);
    expect(checkLockout("ip-b").locked).toBe(false);
    for (let i = 0; i < 4; i++) {
      expect(recordFailure("ip-b").locked).toBe(false);
    }
    expect(recordFailure("ip-b").locked).toBe(true);
  });
});
