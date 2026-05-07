import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  __resetRateLimit,
  checkRateLimit,
  getTrustedClientId,
} from "@/lib/rate-limit.js";

beforeEach(() => __resetRateLimit());
afterEach(() => __resetRateLimit());

describe("checkRateLimit (in-memory fallback)", () => {
  it("allows requests up to the limit and rejects the next one", async () => {
    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit({
        key: "test:key",
        limit: 3,
        windowMs: 1000,
      });
      expect(r.ok).toBe(true);
      expect(r.remaining).toBe(2 - i);
    }
    const blocked = await checkRateLimit({
      key: "test:key",
      limit: 3,
      windowMs: 1000,
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("isolates buckets by key", async () => {
    await checkRateLimit({ key: "a", limit: 1, windowMs: 1000 });
    const blockedA = await checkRateLimit({
      key: "a",
      limit: 1,
      windowMs: 1000,
    });
    const freshB = await checkRateLimit({
      key: "b",
      limit: 1,
      windowMs: 1000,
    });
    expect(blockedA.ok).toBe(false);
    expect(freshB.ok).toBe(true);
  });
});

describe("getTrustedClientId", () => {
  function makeRequest(headers) {
    return {
      headers: {
        get(name) {
          return headers[name.toLowerCase()] ?? null;
        },
      },
    };
  }

  it("prefers cf-connecting-ip", () => {
    expect(
      getTrustedClientId(
        makeRequest({
          "cf-connecting-ip": "203.0.113.5",
          "x-vercel-forwarded-for": "203.0.113.6",
          "x-forwarded-for": "evil-spoof",
        }),
      ),
    ).toBe("203.0.113.5");
  });

  it("falls back to x-vercel-forwarded-for", () => {
    expect(
      getTrustedClientId(
        makeRequest({
          "x-vercel-forwarded-for": "198.51.100.42",
          "x-forwarded-for": "evil-spoof",
        }),
      ),
    ).toBe("198.51.100.42");
  });

  it("returns null when no trusted header is present (ignores x-forwarded-for)", () => {
    expect(
      getTrustedClientId(
        makeRequest({ "x-forwarded-for": "untrusted" }),
      ),
    ).toBeNull();
  });
});
