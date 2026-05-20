/**
 * Security regression coverage for `/api/register/validate-coupon`.
 *
 * Before the hardening this route was an unauthenticated coupon-existence
 * oracle: 30 req/min/IP, distinct error strings for "code not found" vs
 * "expired" vs "tier-restricted" vs "already used". A botnet could iterate
 * through staff-friendly codes ("WSB10", "MAYDAY", …) and bucket them by
 * response.
 *
 * The fix collapses every coupon-eligibility failure into ONE uniform
 * client-facing message. The real reason is logged server-side at WARNING
 * for abuse-detection, but it never goes back to the wire. This file
 * pins:
 *
 *   1. Every distinct coupon-failure path returns the same error string.
 *   2. Input-validation errors (missing miner, invalid email, …) are
 *      NOT collapsed — those don't leak coupon info and remain helpful
 *      to legitimate clients.
 *   3. The rate limit is tight (≤ 6/min/IP).
 *   4. A successful coupon application still returns the full pricing
 *      payload (the uniform-message change must not regress the happy path).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetRateLimit } from "@/lib/rate-limit.js";

const minerMock = vi.fn();
const tiersMock = vi.fn();
vi.mock("@/lib/miners", () => ({
  getMinerBySlug: (...args) => minerMock(...args),
  getTiersForMiner: (...args) => tiersMock(...args),
  TIERS: [{ accountSize: 5000, label: "$5K" }],
}));

const pricingMock = vi.fn();
vi.mock("@/lib/registration-pricing", () => ({
  evaluateRegistrationPricing: (...args) => pricingMock(...args),
}));

const reportWarningMock = vi.fn();
vi.mock("@/lib/errors", () => ({
  reportError: vi.fn(),
  reportCritical: vi.fn(),
  reportWarning: (...args) => reportWarningMock(...args),
  flushErrors: vi.fn().mockResolvedValue(undefined),
  SEVERITY: { ERROR: "error", WARNING: "warning", CRITICAL: "critical" },
}));

vi.mock("@/lib/db", () => ({
  getDb: async () => ({}),
}));

const { POST } = await import("@/app/api/register/validate-coupon/route.js");

const UNIFORM_COUPON_REJECTION = "This code is not valid for this checkout.";
const VALID_COUPON_CODE = "WSB10";

function makeRequest({ body, ip = "203.0.113.7" } = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    method: "POST",
    headers: {
      get(name) {
        const k = name.toLowerCase();
        if (k === "cf-connecting-ip") return ip;
        return null;
      },
    },
    async json() {
      return JSON.parse(text);
    },
  };
}

function couponBody(overrides = {}) {
  return {
    minerSlug: "vanta",
    tierIndex: 0,
    accountSize: 5000,
    couponCode: VALID_COUPON_CODE,
    ...overrides,
  };
}

beforeEach(() => {
  __resetRateLimit();
  reportWarningMock.mockReset();

  minerMock.mockReset();
  minerMock.mockResolvedValue({
    slug: "vanta",
    hotkey: "hk-vanta",
  });

  tiersMock.mockReset();
  tiersMock.mockResolvedValue([
    { accountSize: 5000, priceUsdc: "29", isActive: true },
  ]);

  pricingMock.mockReset();
});

afterEach(() => {
  __resetRateLimit();
});

describe("POST /api/register/validate-coupon — uniform coupon-rejection oracle", () => {
  // Each row is one of the distinct error strings the legacy implementation
  // returned. The hardened route MUST collapse all of them into a single
  // user-facing message — anything else is a regression that re-introduces
  // the enumeration oracle.
  const couponFailureReasons = [
    "Invalid or expired coupon code.",
    "This coupon is not yet valid.",
    "This coupon has expired.",
    "This coupon has already been used.",
    "This coupon has reached its maximum number of uses.",
    "This coupon is not valid for your email.",
    "This coupon is not valid for the selected challenge tier.",
  ];

  for (const reason of couponFailureReasons) {
    it(`collapses "${reason}" into the uniform message`, async () => {
      pricingMock.mockResolvedValue({ ok: false, error: reason });

      const res = await POST(makeRequest({ body: couponBody() }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({
        ok: false,
        valid: false,
        error: UNIFORM_COUPON_REJECTION,
      });
      // The original reason must NEVER appear in the response.
      expect(json.error).not.toBe(reason);
    });
  }

  it("logs the real rejection reason server-side at WARNING", async () => {
    pricingMock.mockResolvedValue({
      ok: false,
      error: "This coupon is not valid for the selected challenge tier.",
    });

    await POST(makeRequest({ body: couponBody({ couponCode: "TIERED99" }) }));

    expect(reportWarningMock).toHaveBeenCalledTimes(1);
    const [, ctx] = reportWarningMock.mock.calls[0];
    expect(ctx.metadata.reason).toBe(
      "This coupon is not valid for the selected challenge tier.",
    );
    expect(ctx.metadata.codeLen).toBe("TIERED99".length);
    expect(ctx.metadata.codePrefix).toBe("TI");
    // The full code must never reach the log payload.
    expect(JSON.stringify(ctx)).not.toContain("TIERED99");
  });

  it("does NOT collapse pricing failures when no coupon was provided", async () => {
    // Defensive: today `evaluateRegistrationPricing` only fails on
    // coupon paths, but if a future code path returns ok:false without
    // a coupon arg we must not blanket-suppress it (would hide real bugs).
    pricingMock.mockResolvedValue({
      ok: false,
      error: "Some other pricing failure.",
    });

    const res = await POST(
      makeRequest({ body: couponBody({ couponCode: undefined }) }),
    );
    const json = await res.json();
    expect(json.error).toBe("Some other pricing failure.");
    expect(reportWarningMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/register/validate-coupon — input-validation errors are NOT collapsed", () => {
  // Input-validation errors come from the route itself (before pricing is
  // even called) and don't leak coupon existence — they describe the
  // shape of the request. Keeping them specific is a UX win.
  it("returns the specific 'Missing miner or tier selection' error", async () => {
    const res = await POST(
      makeRequest({ body: { tierIndex: 0, couponCode: VALID_COUPON_CODE } }),
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing miner or tier selection.");
  });

  it("returns the specific 'Unknown miner' error", async () => {
    minerMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ body: couponBody() }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Unknown miner.");
  });

  it("returns the specific 'Invalid HL address format' error", async () => {
    const res = await POST(
      makeRequest({ body: couponBody({ hlAddress: "not-an-address" }) }),
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid HL address format.");
  });

  it("returns the specific 'Invalid email address format' error", async () => {
    const res = await POST(
      makeRequest({ body: couponBody({ email: "not-an-email" }) }),
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid email address format.");
  });
});

describe("POST /api/register/validate-coupon — rate limit", () => {
  it("rejects the 7th request from the same IP within a 60s window", async () => {
    pricingMock.mockResolvedValue({
      ok: true,
      tierListPrice: 29,
      baseAfterDev: 29,
      effectivePrice: 0,
      discountAmount: 29,
      couponMeta: {
        couponId: "c1",
        code: VALID_COUPON_CODE,
        discountType: "percent",
        discountValue: 100,
      },
      devTest: false,
      tierSlug: "vanta:5000",
    });

    // 6 successful requests fit inside the limit.
    for (let i = 0; i < 6; i++) {
      const res = await POST(makeRequest({ body: couponBody(), ip: "1.2.3.4" }));
      expect(res.status, `request ${i + 1} should pass`).toBe(200);
    }
    // 7th must be 429.
    const blocked = await POST(makeRequest({ body: couponBody(), ip: "1.2.3.4" }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("buckets per-IP — a different IP starts with a fresh budget", async () => {
    pricingMock.mockResolvedValue({
      ok: true,
      tierListPrice: 29,
      baseAfterDev: 29,
      effectivePrice: 0,
      discountAmount: 29,
      couponMeta: { couponId: "c1", code: VALID_COUPON_CODE, discountType: "percent", discountValue: 100 },
      devTest: false,
      tierSlug: "vanta:5000",
    });

    for (let i = 0; i < 6; i++) {
      await POST(makeRequest({ body: couponBody(), ip: "10.0.0.1" }));
    }
    const blockedA = await POST(
      makeRequest({ body: couponBody(), ip: "10.0.0.1" }),
    );
    expect(blockedA.status).toBe(429);

    // Different IP — full budget.
    const freshB = await POST(
      makeRequest({ body: couponBody(), ip: "10.0.0.2" }),
    );
    expect(freshB.status).toBe(200);
  });
});

describe("POST /api/register/validate-coupon — happy path", () => {
  it("returns full pricing details when the coupon applies", async () => {
    pricingMock.mockResolvedValue({
      ok: true,
      tierListPrice: 29,
      baseAfterDev: 29,
      effectivePrice: 0,
      discountAmount: 29,
      couponMeta: {
        couponId: "c1",
        code: VALID_COUPON_CODE,
        discountType: "percent",
        discountValue: 100,
      },
      devTest: false,
      tierSlug: "vanta:5000",
    });

    const res = await POST(makeRequest({ body: couponBody() }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      valid: true,
      tierListPrice: 29,
      effectivePrice: 0,
      discountAmount: 29,
      couponApplied: true,
      tierSlug: "vanta:5000",
    });
    expect(reportWarningMock).not.toHaveBeenCalled();
  });

  it("returns valid:true with no coupon arg (just pricing for the tier)", async () => {
    pricingMock.mockResolvedValue({
      ok: true,
      tierListPrice: 29,
      baseAfterDev: 29,
      effectivePrice: 29,
      discountAmount: 0,
      couponMeta: null,
      devTest: false,
      tierSlug: "vanta:5000",
    });

    const res = await POST(
      makeRequest({ body: couponBody({ couponCode: undefined }) }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.valid).toBe(true);
    expect(json.couponApplied).toBe(false);
  });
});
