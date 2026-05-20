/**
 * Pure helpers shared with checkout / registration promo validation (ported
 * from vanta-ui `lib/coupons/checkout-coupon-rules.ts`).
 */

/**
 * Hyperscaled tier slug for coupons: `{miner-slug}:{account-size}` matching
 * `coupons.allowed_tier_ids` in the Command Center UI.
 *
 * @param {string|null|undefined} allowedTierIds jsonb-derived array from DB or null
 * @param {string|null|undefined} checkoutTierSlug
 */
export function checkoutTierAllowsCoupon(allowedTierIds, checkoutTierSlug) {
  if (allowedTierIds == null || allowedTierIds.length === 0) {
    return true;
  }
  const tid = typeof checkoutTierSlug === "string" ? checkoutTierSlug.trim() : "";
  if (!tid) return false;
  const allowed = new Set(
    allowedTierIds.map((x) => String(x).trim()).filter(Boolean),
  );
  return allowed.has(tid);
}

/**
 * Matches vanta checkout rounding.
 *
 * @param {"percent"|"fixed"} discountType
 * @param {number} discountValue
 * @param {number} baseAmount
 */
export function computeCouponDiscount(discountType, discountValue, baseAmount) {
  const dv = Number(discountValue);
  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = Math.round(((baseAmount * dv) / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(dv, baseAmount);
  }
  const finalAmount = Math.max(0, baseAmount - discountAmount);
  return { discountAmount, finalAmount };
}
