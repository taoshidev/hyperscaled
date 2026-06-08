import { and, eq, ne, sql } from "drizzle-orm";

import { coupons, promotionalCampaigns } from "@/lib/db/schema";

export const normalizeCouponCode = (raw) => {
  if (raw == null) return "";
  return String(raw).trim().toUpperCase();
};

/**
 * Resolve the coupon a campaign should use, WITHOUT mutating coupons the
 * campaign doesn't own. Coupons are shared, first-class entities (partner /
 * affiliate / evergreen codes), so attaching a campaign must never silently
 * rewrite a coupon's discount or validity window.
 *
 * Two modes:
 *   - Existing-coupon (`opts.couponId`): attach by id only. Never mutated here.
 *   - New-coupon (typed `opts.code`): the code must be unused. A collision is an
 *     error (we never adopt or repurpose someone else's coupon). Otherwise we
 *     create a fresh, campaign-owned coupon whose window tracks the campaign.
 *
 * @param {import('@/lib/db').Db} db
 * @param {{
 *   couponId?: string|null,
 *   code?: string|null,
 *   discountType?: "percent"|"fixed"|null,
 *   discountValue?: number|string|null,
 *   startsAt?: Date|null,
 *   endsAt?: Date|null,
 * }} opts
 * @param {string|null} staffWallet
 * @returns {Promise<string>} the resolved coupon id
 */
export async function resolveCampaignCoupon(db, opts, staffWallet) {
  if (opts.couponId) {
    const [existing] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.id, opts.couponId))
      .limit(1);
    if (!existing) throw new Error("Selected coupon no longer exists.");
    return existing.id;
  }

  const code = normalizeCouponCode(opts.code);
  if (!code) throw new Error("Coupon code is required.");

  const [collision] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);
  if (collision) {
    throw new Error(
      `Coupon code "${code}" is already in use. Select it from the existing-coupon list instead of retyping it.`,
    );
  }

  if (!opts.discountType || opts.discountValue == null) {
    throw new Error("Provide a discount type and value to create a new coupon.");
  }

  const [inserted] = await db
    .insert(coupons)
    .values({
      code,
      discountType: opts.discountType,
      discountValue: String(opts.discountValue),
      useType: "unlimited",
      maxUses: null,
      allowedEmails: null,
      allowedTierIds: null,
      validFrom: opts.startsAt ?? null,
      validUntil: opts.endsAt ?? null,
      campaignOwned: true,
      createdByWallet: staffWallet,
      notes: "Auto-created for promotional campaign.",
    })
    .returning({ id: coupons.id });
  if (!inserted) throw new Error("Failed to create coupon.");
  return inserted.id;
}

/**
 * Re-clamp a coupon's validity window to the campaign window — but ONLY for
 * coupons the campaign system created (`campaign_owned`) AND that no other
 * campaign points at. Shared / partner coupons (and owned coupons that ended up
 * referenced by more than one campaign) are left untouched so a campaign edit
 * never has surprise side effects on a code distributed elsewhere.
 *
 * @param {import('@/lib/db').Db} db
 * @param {string} couponId
 * @param {Date} startsAt
 * @param {Date} endsAt
 * @param {string|null} campaignId  Campaign being saved (excluded from the
 *                                   "other references" check); null on create.
 * @returns {Promise<boolean>} whether the coupon window was actually rewritten
 */
export async function syncOwnedCouponWindow(
  db,
  couponId,
  startsAt,
  endsAt,
  campaignId,
) {
  if (!couponId) return false;
  const [coupon] = await db
    .select({ campaignOwned: coupons.campaignOwned })
    .from(coupons)
    .where(eq(coupons.id, couponId))
    .limit(1);
  if (!coupon || !coupon.campaignOwned) return false;

  const refConds = [eq(promotionalCampaigns.couponId, couponId)];
  if (campaignId) refConds.push(ne(promotionalCampaigns.id, campaignId));
  const [others] = await db
    .select({ count: sql`count(*)::int` })
    .from(promotionalCampaigns)
    .where(and(...refConds));
  if (Number(others?.count ?? 0) > 0) return false;

  await db
    .update(coupons)
    .set({ validFrom: startsAt, validUntil: endsAt, updatedAt: new Date() })
    .where(eq(coupons.id, couponId));
  return true;
}
