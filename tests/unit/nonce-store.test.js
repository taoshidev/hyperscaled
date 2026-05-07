/**
 * Tests for `lib/nonce-store.js` — the Postgres-backed nonce store
 * that powers replay protection on signed requests.
 *
 * Key invariants:
 *   1. First `consumeNonce(key)` returns true (key is fresh).
 *   2. Repeat `consumeNonce(key)` returns false (already used).
 *   3. The fast-path in-memory cache short-circuits without touching the DB
 *      on a repeat from the same instance.
 *   4. After expiry + cache reset, the same key can be consumed again
 *      (the DB-side onConflictDoNothing is the source of truth).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stand-in for Drizzle's chainable insert builder. Our nonce store does
// `db.insert(authNonces).values({...}).onConflictDoNothing(...).returning(...)`
// and reads `inserted.length === 0` to detect a duplicate.
function makeFakeDb() {
  // Each call to insert(...).values(...).onConflictDoNothing().returning()
  // returns a promise that resolves to either [] (conflict / dup) or
  // [{ nonceKey }] (fresh insert). The test controls the next outcome.
  const seenKeys = new Set();
  const deleteSpy = vi.fn().mockResolvedValue(undefined);

  return {
    seenKeys,
    deleteSpy,
    insert: () => ({
      values: ({ nonceKey }) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (seenKeys.has(nonceKey)) return [];
            seenKeys.add(nonceKey);
            return [{ nonceKey }];
          },
        }),
      }),
    }),
    delete: () => ({
      where: (...args) => deleteSpy(...args),
    }),
  };
}

let fakeDb;
const getDbMock = vi.fn(async () => fakeDb);
vi.mock("@/lib/db/index.js", () => ({
  getDb: () => getDbMock(),
}));
vi.mock("@/lib/db/schema.js", () => ({
  authNonces: { nonceKey: "nonceKey", expiresAt: "expiresAt" },
}));

const { consumeNonce, __resetNonceCache } = await import(
  "@/lib/nonce-store.js"
);

beforeEach(() => {
  fakeDb = makeFakeDb();
  getDbMock.mockClear();
  __resetNonceCache();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("consumeNonce", () => {
  it("returns true the first time a key is seen", async () => {
    const ok = await consumeNonce("0xabc:1700000000000", 60_000);
    expect(ok).toBe(true);
    expect(fakeDb.seenKeys.has("0xabc:1700000000000")).toBe(true);
  });

  it("returns false on replay of the same key", async () => {
    const k = "0xabc:1700000000000";
    expect(await consumeNonce(k, 60_000)).toBe(true);
    expect(await consumeNonce(k, 60_000)).toBe(false);
  });

  it("short-circuits a replay via the in-memory cache (no DB hit on second call)", async () => {
    const k = "0xabc:1700000000000";
    await consumeNonce(k, 60_000);
    const callsAfterFirst = getDbMock.mock.calls.length;
    const ok = await consumeNonce(k, 60_000);
    expect(ok).toBe(false);
    // Second call is rejected by the local cache before getDb() is touched.
    expect(getDbMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("treats different keys independently", async () => {
    expect(await consumeNonce("0xabc:1", 60_000)).toBe(true);
    expect(await consumeNonce("0xdef:1", 60_000)).toBe(true);
    expect(await consumeNonce("0xabc:2", 60_000)).toBe(true);
  });

  it("scopes nonces by signer (same nonce, different wallet → both fresh)", async () => {
    expect(await consumeNonce("walletA:1700000000000", 60_000)).toBe(true);
    expect(await consumeNonce("walletB:1700000000000", 60_000)).toBe(true);
  });

  it("DB-side conflict (e.g. another instance won the race) returns false", async () => {
    // Pre-populate the DB so the insert returns [] on first try.
    fakeDb.seenKeys.add("0xabc:1700000000000");
    const ok = await consumeNonce("0xabc:1700000000000", 60_000);
    expect(ok).toBe(false);
  });

  it("expired entries fall out of the local cache and DB is queried again", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const k = "0xabc:cycle";
    expect(await consumeNonce(k, 1_000)).toBe(true);

    // Jump past the TTL → local cache should evict on next access.
    vi.advanceTimersByTime(2_000);

    // Simulate the row also having been swept on the DB side.
    fakeDb.seenKeys.delete(k);

    expect(await consumeNonce(k, 1_000)).toBe(true);
  });
});
