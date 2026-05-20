import { describe, expect, it } from "vitest";
import {
  buildBaseRegisterBody,
  bundleSignedFor,
  bundleStillCovers,
  couponCodeHeader,
} from "@/lib/registration-base-body.js";

const HL = "0x1111111111111111111111111111111111111111";
const PAY = "0x2222222222222222222222222222222222222222";
const PAYOUT = "0x3333333333333333333333333333333333333333";

describe("registration-base-body — couponCodeHeader", () => {
  it("returns the trimmed/uppercased x-coupon-code header when provided", () => {
    expect(couponCodeHeader("  hs-foo  ")).toEqual({ "x-coupon-code": "HS-FOO" });
  });

  it("returns an empty header dict for empty/whitespace/undefined inputs (spread-safe)", () => {
    expect(couponCodeHeader("")).toEqual({});
    expect(couponCodeHeader("   ")).toEqual({});
    expect(couponCodeHeader(undefined)).toEqual({});
    expect(couponCodeHeader(null)).toEqual({});
  });
});

describe("registration-base-body — buildBaseRegisterBody (dual-wallet shape)", () => {
  it("never includes couponCode — pricing modifiers travel via x-coupon-code header", () => {
    const body = buildBaseRegisterBody({
      minerSlug: "vanta",
      hlAddress: HL,
      accountSize: 5000,
      tierIndex: 1,
      payoutAddress: HL,
      email: "u@example.com",
      toltCustomerId: "tolt-1",
    });
    expect(body).not.toHaveProperty("couponCode");
  });

  it("omits hlTransferSender — server falls back to the actual x402 signer", () => {
    const body = buildBaseRegisterBody({
      minerSlug: "vanta",
      hlAddress: HL,
      accountSize: 5000,
      tierIndex: 1,
      payoutAddress: HL,
      email: "u@example.com",
      toltCustomerId: "tolt-1",
    });
    expect(body).not.toHaveProperty("hlTransferSender");
  });

  it("preserves payoutAddress as-passed (the call site pins it to hlAddress, not the connected wallet)", () => {
    const sameWallet = buildBaseRegisterBody({
      minerSlug: "vanta",
      hlAddress: HL,
      accountSize: 5000,
      tierIndex: 1,
      payoutAddress: HL,
    });
    expect(sameWallet.payoutAddress).toBe(HL);

    const customPayout = buildBaseRegisterBody({
      minerSlug: "vanta",
      hlAddress: HL,
      accountSize: 5000,
      tierIndex: 1,
      payoutAddress: PAYOUT,
    });
    expect(customPayout.payoutAddress).toBe(PAYOUT);
  });

  it("produces stable JSON bytes when called twice with identical inputs (signature replay safety)", () => {
    const args = {
      minerSlug: "vanta",
      hlAddress: HL,
      accountSize: 5000,
      tierIndex: 1,
      payoutAddress: HL,
      email: "u@example.com",
      toltCustomerId: "tolt-1",
    };
    expect(JSON.stringify(buildBaseRegisterBody(args))).toBe(
      JSON.stringify(buildBaseRegisterBody(args)),
    );
  });

  it("body bytes do NOT change when an unrelated couponCode arg is passed (header-only contract)", () => {
    const args = {
      minerSlug: "vanta",
      hlAddress: HL,
      accountSize: 5000,
      tierIndex: 1,
      payoutAddress: HL,
      email: "u@example.com",
      toltCustomerId: "tolt-1",
    };
    expect(JSON.stringify(buildBaseRegisterBody(args))).toBe(
      JSON.stringify(buildBaseRegisterBody({ ...args, couponCode: "HS-FOO" })),
    );
  });

  it("drops empty email so it isn't sent as an empty string", () => {
    const body = buildBaseRegisterBody({
      minerSlug: "vanta",
      hlAddress: HL,
      accountSize: 5000,
      tierIndex: 1,
      payoutAddress: HL,
      email: "",
    });
    expect(body.email).toBeUndefined();
  });
});

describe("registration-base-body — ownership bundle invalidation", () => {
  function bundleFor(overrides = {}) {
    return {
      signedFor: bundleSignedFor({
        minerSlug: "vanta",
        hlAddress: HL,
        accountSize: 5000,
        tierIndex: 1,
        payoutAddress: HL,
        email: "u@example.com",
        ...overrides,
      }),
    };
  }

  function currentFor(overrides = {}) {
    return bundleSignedFor({
      minerSlug: "vanta",
      hlAddress: HL,
      accountSize: 5000,
      tierIndex: 1,
      payoutAddress: HL,
      email: "u@example.com",
      ...overrides,
    });
  }

  it("returns false for a null bundle (used as the 'no cached signature' guard)", () => {
    expect(bundleStillCovers(null, currentFor())).toBe(false);
  });

  it("stays valid when the form is unchanged", () => {
    expect(bundleStillCovers(bundleFor(), currentFor())).toBe(true);
  });

  it("stays valid when only address casing changes (signedFor lowercases)", () => {
    expect(
      bundleStillCovers(bundleFor(), currentFor({ hlAddress: HL.toUpperCase() })),
    ).toBe(true);
  });

  it("invalidates when payoutAddress changes — protects against post-sign payout tampering", () => {
    expect(
      bundleStillCovers(bundleFor(), currentFor({ payoutAddress: PAY })),
    ).toBe(false);
  });

  it("STAYS valid when only the coupon changes — coupon is header-only, not signed-over", () => {
    // Regression: prior to the header transport, changing the promo code in
    // the dual-wallet flow invalidated the cached HL ownership signature and
    // surfaced a confusing "wallet doesn't match" banner. Coupon edits must
    // no longer drop the bundle.
    const bundle = bundleFor();
    const next = currentFor();
    expect(bundleStillCovers(bundle, next)).toBe(true);

    // bundleSignedFor explicitly ignores any couponCode argument it receives.
    expect(bundleSignedFor({ couponCode: "DOES-NOT-MATTER" })).not.toHaveProperty(
      "couponCode",
    );
  });

  it("invalidates when minerSlug, accountSize, tierIndex, hlAddress, or email change", () => {
    expect(
      bundleStillCovers(bundleFor(), currentFor({ minerSlug: "other" })),
    ).toBe(false);
    expect(
      bundleStillCovers(bundleFor(), currentFor({ accountSize: 10000 })),
    ).toBe(false);
    expect(
      bundleStillCovers(bundleFor(), currentFor({ tierIndex: 2 })),
    ).toBe(false);
    expect(
      bundleStillCovers(bundleFor(), currentFor({ hlAddress: PAY })),
    ).toBe(false);
    expect(
      bundleStillCovers(bundleFor(), currentFor({ email: "v@example.com" })),
    ).toBe(false);
  });
});
