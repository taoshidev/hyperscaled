import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  signAttributionCookie,
  verifyAttributionCookie,
  stripAttributionPromoFromCookieValue,
} from "@/lib/auth/attribution-cookie.js";

const SECRET = "abcdef0123456789abcdef0123456789-test-secret";

describe("attribution-cookie codec", () => {
  let originalSecret;

  beforeEach(() => {
    originalSecret = process.env.ATTRIBUTION_COOKIE_SECRET;
    process.env.ATTRIBUTION_COOKIE_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret == null) delete process.env.ATTRIBUTION_COOKIE_SECRET;
    else process.env.ATTRIBUTION_COOKIE_SECRET = originalSecret;
  });

  it("round-trips a populated payload", async () => {
    const payload = {
      affiliate: "jdoe",
      tenant: "lunarcrush",
      promo: "SUMMER25",
      clickId: "11111111-1111-4111-8111-111111111111",
      firstTouchAt: 1716068400,
    };
    const cookie = await signAttributionCookie(payload);
    expect(typeof cookie).toBe("string");
    expect(cookie.includes(".")).toBe(true);

    const decoded = await verifyAttributionCookie(cookie);
    expect(decoded).toEqual(payload);
  });

  it("round-trips a sparse payload (only clickId + firstTouchAt)", async () => {
    const payload = {
      affiliate: null,
      tenant: null,
      promo: null,
      clickId: "22222222-2222-4222-8222-222222222222",
      firstTouchAt: 1716068400,
    };
    const cookie = await signAttributionCookie(payload);
    const decoded = await verifyAttributionCookie(cookie);
    expect(decoded).toEqual(payload);
  });

  it("rejects a tampered payload", async () => {
    const cookie = await signAttributionCookie({
      affiliate: "jdoe",
      tenant: null,
      promo: null,
      clickId: "33333333-3333-4333-8333-333333333333",
      firstTouchAt: 1716068400,
    });
    const [payloadB64, sig] = cookie.split(".");
    // Flip a single byte in the payload — signature should no longer match.
    const tampered = `${payloadB64.slice(0, -1)}A.${sig}`;
    expect(await verifyAttributionCookie(tampered)).toBeNull();
  });

  it("rejects a cookie signed with a different secret", async () => {
    const cookie = await signAttributionCookie({
      affiliate: "jdoe",
      tenant: null,
      promo: null,
      clickId: "44444444-4444-4444-8444-444444444444",
      firstTouchAt: 1716068400,
    });
    process.env.ATTRIBUTION_COOKIE_SECRET = "rotated-secret-also-32-chars-min-yes";
    expect(await verifyAttributionCookie(cookie)).toBeNull();
  });

  it("returns null for malformed input", async () => {
    expect(await verifyAttributionCookie(null)).toBeNull();
    expect(await verifyAttributionCookie("")).toBeNull();
    expect(await verifyAttributionCookie("not-a-cookie")).toBeNull();
    expect(await verifyAttributionCookie("missing.parts.too.many")).toBeNull();
  });

  it("stripAttributionPromoFromCookieValue removes promo and preserves affiliate", async () => {
    const original = await signAttributionCookie({
      affiliate: "jdoe",
      tenant: "beanstock",
      promo: "HS-TA34-H1CL",
      clickId: "55555555-5555-4555-8555-555555555555",
      firstTouchAt: 1716068400,
    });
    const stripped = await stripAttributionPromoFromCookieValue(original);
    expect(stripped).toBeTruthy();
    const decoded = await verifyAttributionCookie(stripped);
    expect(decoded).toEqual({
      affiliate: "jdoe",
      tenant: "beanstock",
      promo: null,
      clickId: "55555555-5555-4555-8555-555555555555",
      firstTouchAt: 1716068400,
    });
  });

  it("stripAttributionPromoFromCookieValue returns null when there is no promo", async () => {
    const original = await signAttributionCookie({
      affiliate: "jdoe",
      tenant: null,
      promo: null,
      clickId: "66666666-6666-4666-8666-666666666666",
      firstTouchAt: 1716068400,
    });
    expect(await stripAttributionPromoFromCookieValue(original)).toBeNull();
  });
});
