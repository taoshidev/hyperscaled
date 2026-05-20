import { describe, expect, it } from "vitest";

import {
  toUsdcAtomicString,
  toUsdcDecimalString,
} from "@/lib/usdc-amount";
import { computeCouponDiscount } from "@/lib/checkout-coupon-rules";

describe("USDC amount boundary helpers", () => {
  it("toUsdcAtomicString rounds to integer microUSDC for whole-dollar amounts", () => {
    expect(toUsdcAtomicString(29)).toBe("29000000");
    expect(toUsdcAtomicString(299)).toBe("299000000");
    expect(toUsdcAtomicString(0)).toBe("0");
  });

  it("toUsdcAtomicString rounds float-drift amounts to a clean integer string", () => {
    const driftedFinalAmount = 200.32999999999998;
    expect(toUsdcAtomicString(driftedFinalAmount)).toBe("200330000");
  });

  it("toUsdcAtomicString handles two-decimal prices precisely", () => {
    expect(toUsdcAtomicString(19.99)).toBe("19990000");
    expect(toUsdcAtomicString(0.01)).toBe("10000");
  });

  it("toUsdcAtomicString rejects negative or non-finite inputs", () => {
    expect(() => toUsdcAtomicString(-1)).toThrow(RangeError);
    expect(() => toUsdcAtomicString(NaN)).toThrow(RangeError);
    expect(() => toUsdcAtomicString(Infinity)).toThrow(RangeError);
  });

  it("toUsdcDecimalString returns a stable 2-decimal string", () => {
    expect(toUsdcDecimalString(200.32999999999998)).toBe("200.33");
    expect(toUsdcDecimalString(29)).toBe("29.00");
    expect(toUsdcDecimalString(0)).toBe("0.00");
    expect(toUsdcDecimalString(19.999)).toBe("20.00");
  });
});

describe("computeCouponDiscount float-safe rounding", () => {
  it("returns a 2-decimal-clean finalAmount for the 33% off $299 case", () => {
    const { discountAmount, finalAmount } = computeCouponDiscount(
      "percent",
      33,
      299,
    );
    expect(discountAmount).toBe(98.67);
    expect(finalAmount).toBe(200.33);
    expect(toUsdcAtomicString(finalAmount)).toBe("200330000");
  });

  it("returns a clean finalAmount for representative percent-off prices", () => {
    expect(computeCouponDiscount("percent", 17, 119).finalAmount).toBe(98.77);
    expect(computeCouponDiscount("percent", 50, 29).finalAmount).toBe(14.5);
    expect(computeCouponDiscount("percent", 100, 29).finalAmount).toBe(0);
  });

  it("clamps a fixed discount to the base amount and returns 2dp finalAmount", () => {
    expect(computeCouponDiscount("fixed", 50, 29).finalAmount).toBe(0);
    expect(computeCouponDiscount("fixed", 10, 29).finalAmount).toBe(19);
  });
});
