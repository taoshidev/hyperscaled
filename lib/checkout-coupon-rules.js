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
 * Computes the price a buyer pays after a coupon/campaign discount.
 *
 * The amount the buyer pays is rounded UP to a whole dollar so prices stay
 * clean (no trailing cents) on the tier cards, the order summary, and the
 * on-chain charge — e.g. a 25% campaign turns $999 into $750 (not $749.25),
 * which also keeps the headline price from overflowing the tier card layout.
 * Sub-dollar amounts (the $0.01 dev/test sentinel) are left untouched so test
 * wallets aren't inflated to $1. The discount is derived from the rounded
 * total so summaries always reconcile (base − discount === total).
 *
 * @param {"percent"|"fixed"} discountType
 * @param {number} discountValue
 * @param {number} baseAmount
 */
export function computeCouponDiscount(discountType, discountValue, baseAmount) {
  const dv = Number(discountValue);
  let rawDiscount = 0;
  if (discountType === "percent") {
    rawDiscount = (baseAmount * dv) / 100;
  } else {
    rawDiscount = Math.min(dv, baseAmount);
  }
  // Round to cents first to absorb float drift, then round the payable amount
  // up to a whole dollar (only for real $1+ prices).
  const centsFinal = Math.round(Math.max(0, baseAmount - rawDiscount) * 100) / 100;
  const finalAmount = centsFinal >= 1 ? Math.ceil(centsFinal) : centsFinal;
  const discountAmount = Math.max(
    0,
    Math.round((baseAmount - finalAmount) * 100) / 100,
  );
  return { discountAmount, finalAmount };
}
