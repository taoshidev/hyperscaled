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

describe("computeCouponDiscount whole-dollar round-up", () => {
  it("rounds the payable amount up to a whole dollar for the 33% off $299 case", () => {
    const { discountAmount, finalAmount } = computeCouponDiscount(
      "percent",
      33,
      299,
    );
    // 299 * 0.67 = 200.33 → rounded up to 201; discount reconciles to 98.
    expect(finalAmount).toBe(201);
    expect(discountAmount).toBe(98);
    expect(toUsdcAtomicString(finalAmount)).toBe("201000000");
  });

  it("rounds representative percent-off prices up to whole dollars", () => {
    expect(computeCouponDiscount("percent", 17, 119).finalAmount).toBe(99); // 98.77 → 99
    expect(computeCouponDiscount("percent", 50, 29).finalAmount).toBe(15); // 14.5 → 15
    expect(computeCouponDiscount("percent", 100, 29).finalAmount).toBe(0);
  });

  it("clamps a fixed discount to the base amount and rounds the payable up", () => {
    expect(computeCouponDiscount("fixed", 50, 29).finalAmount).toBe(0);
    expect(computeCouponDiscount("fixed", 10, 29).finalAmount).toBe(19);
  });

  it("leaves the sub-dollar dev/test sentinel untouched", () => {
    // A campaign coupon auto-applied on a $0.01 dev-test price must not be
    // inflated to $1.
    expect(computeCouponDiscount("percent", 25, 0.01).finalAmount).toBe(0.01);
  });
});
