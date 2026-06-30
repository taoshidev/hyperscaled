/**
 * Regression coverage for the coupon-meta shape returned by
 * `evaluateRegistrationPricing`.
 *
 * The conversion-ledger fix (record the actually-applied coupon code on
 * `referral_attributions.promoCode` and `registration_attributions.promoCode`)
 * relies on `couponMeta.code` being the canonical DB-stored code. These tests
 * lock that contract in:
 *
 *   - meta carries `code` (canonical code from `coupons.code`) when a valid
 *     coupon matches.
 *   - meta is `null` (no `code`, no surprises) when the user typed nothing.
 *   - the canonical `code` is what's loaded from the DB row — even if the
 *     user typed a different casing — so attribution rows can't drift from
 *     the coupons table.
 *   - the meta still includes `couponId`, `discountType`, and `discountValue`
 *     so existing callers (`applyCouponToAmount`, redemption recorder) keep
 *     working.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dev-test", () => ({
  isAnyDevTestWallet: () => false,
  DEV_TEST_PRICE: 1,
}));

vi.mock("@/lib/wsb-tier-list-price", () => ({
  listPriceUsdcFromDbTier: (_slug, _accountSize, dbPriceUsdc) => Number(dbPriceUsdc),
}));

vi.mock("@/lib/db/schema", () => ({
  coupons: {
    id: "coupons.id",
    code: "coupons.code",
    discountType: "coupons.discount_type",
    discountValue: "coupons.discount_value",
    useType: "coupons.use_type",
    maxUses: "coupons.max_uses",
    allowedEmails: "coupons.allowed_emails",
    allowedTierIds: "coupons.allowed_tier_ids",
    validFrom: "coupons.valid_from",
    validUntil: "coupons.valid_until",
  },
  couponRedemptions: {
    id: "coupon_redemptions.id",
    couponId: "coupon_redemptions.coupon_id",
  },
}));

const { evaluateRegistrationPricing } = await import(
  "@/lib/registration-pricing"
);

/**
 * Build a fake Drizzle-shaped `db`. The pricing module only reads from two
 * tables in this code path:
 *
 *   1. `select().from(coupons).where(...).limit(1)` — coupon row by code.
 *   2. one of:
 *      - `select({ id }).from(couponRedemptions).where(...).limit(1)` for
 *        one_time coupons (returns 0 or 1 redemption row to gate reuse).
 *      - `select({ c: count() }).from(couponRedemptions).where(...)` for
 *        multi_use / unlimited (returns total redemptions; no `.limit`).
 *
 * The mock tracks the call sequence so the first select returns the coupon
 * row and the second select returns either an empty redemption list or a
 * `{ c: 0 }` count, depending on which chain shape the loader uses.
 */
function makeDb({ couponRow }) {
  let selectCall = 0;
  return {
    select() {
      selectCall += 1;
      const isCouponLookup = selectCall === 1;
      return {
        from: () => {
          const where = () => {
            // The loader sometimes chains `.limit(1)` (coupon row + one-time
            // redemption check) and sometimes does not (multi-use count).
            // The thenable lets us await the chain WITHOUT `.limit()` and
            // still resolve to the same value the multi-use branch wants.
            const result = isCouponLookup
              ? couponRow
                ? [couponRow]
                : []
              : [{ c: 0 }];
            return {
              limit: async () => (isCouponLookup ? result : []),
              then: (resolve, reject) =>
                Promise.resolve(result).then(resolve, reject),
            };
          };
          return { where };
        },
      };
    },
  };
}

const MINER = { slug: "vanta", hotkey: "hk-vanta" };
const TIER = { accountSize: 5000, priceUsdc: "29" };
const HL_ADDRESS = "0x1111111111111111111111111111111111111111";

describe("evaluateRegistrationPricing — couponMeta.code", () => {
  it("returns null couponMeta when the user typed no code", async () => {
    const db = makeDb({ couponRow: null });
    const res = await evaluateRegistrationPricing(
      db,
      MINER,
      TIER,
      HL_ADDRESS,
      null,
      "user@example.com",
      "",
    );
    expect(res.ok).toBe(true);
    expect(res.couponMeta).toBeNull();
    expect(res.effectivePrice).toBe(29);
    expect(res.discountAmount).toBe(0);
  });

  it("populates couponMeta.code with the canonical DB-stored code (percent off)", async () => {
    // The DB stores the code uppercase. The user typed it uppercase too.
    const db = makeDb({
      couponRow: {
        id: "coupon-uuid-1",
        code: "HS-55Z3-CA9V",
        discountType: "percent",
        discountValue: "100",
        useType: "multi_use",
        maxUses: null,
        allowedEmails: null,
        allowedTierIds: null,
        validFrom: null,
        validUntil: null,
      },
    });

    const res = await evaluateRegistrationPricing(
      db,
      MINER,
      TIER,
      HL_ADDRESS,
      null,
      "user@example.com",
      "HS-55Z3-CA9V",
    );

    expect(res.ok).toBe(true);
    expect(res.couponMeta).not.toBeNull();
    // The fix: meta carries the canonical `code` so the attribution insert
    // can record it instead of whatever stale string was in `hs_attr`.
    expect(res.couponMeta.code).toBe("HS-55Z3-CA9V");
    expect(res.couponMeta.couponId).toBe("coupon-uuid-1");
    expect(res.couponMeta.discountType).toBe("percent");
    expect(res.couponMeta.discountValue).toBe(100);
    // Sanity: 100% off → effectivePrice 0, discount 29.
    expect(res.effectivePrice).toBe(0);
    expect(res.discountAmount).toBe(29);
  });

  it("returns the DB-canonical code even when the user typed mixed case", async () => {
    // The pricing module normalizes the user's input before the DB lookup
    // (trim + uppercase). The meta then echoes whatever the DB row says,
    // which is the source of truth for the conversion ledger.
    const db = makeDb({
      couponRow: {
        id: "coupon-uuid-2",
        code: "HS-XGKX-BPJ6",
        discountType: "percent",
        discountValue: "50",
        useType: "one_time",
        maxUses: null,
        allowedEmails: null,
        allowedTierIds: null,
        validFrom: null,
        validUntil: null,
      },
    });

    const res = await evaluateRegistrationPricing(
      db,
      MINER,
      TIER,
      HL_ADDRESS,
      null,
      "user@example.com",
      "  hs-xgkx-bpj6  ",
    );

    expect(res.ok).toBe(true);
    expect(res.couponMeta?.code).toBe("HS-XGKX-BPJ6");
    expect(res.effectivePrice).toBe(15); // 29 * 0.5 = 14.5 → rounded up to 15
    expect(res.discountAmount).toBe(14);
  });

  it("propagates a fixed-amount coupon's code on the meta", async () => {
    const db = makeDb({
      couponRow: {
        id: "coupon-uuid-3",
        code: "FLAT10",
        discountType: "fixed",
        discountValue: "10",
        useType: "multi_use",
        maxUses: 100,
        allowedEmails: null,
        allowedTierIds: null,
        validFrom: null,
        validUntil: null,
      },
    });

    const res = await evaluateRegistrationPricing(
      db,
      MINER,
      TIER,
      HL_ADDRESS,
      null,
      "user@example.com",
      "FLAT10",
    );

    expect(res.ok).toBe(true);
    expect(res.couponMeta?.code).toBe("FLAT10");
    expect(res.couponMeta?.discountType).toBe("fixed");
    expect(res.couponMeta?.discountValue).toBe(10);
    expect(res.effectivePrice).toBe(19);
    expect(res.discountAmount).toBe(10);
  });

  it("does NOT return couponMeta (and so no `code`) when the coupon is missing", async () => {
    const db = makeDb({ couponRow: null });
    const res = await evaluateRegistrationPricing(
      db,
      MINER,
      TIER,
      HL_ADDRESS,
      null,
      "user@example.com",
      "DOES-NOT-EXIST",
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/invalid|expired/i);
    expect(res.couponMeta).toBeUndefined();
  });
});
