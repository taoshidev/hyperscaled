import { and, eq, lte, gte, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  promotionalCampaigns,
  coupons,
  entityMiners,
} from "@/lib/db/schema";
import { computeCouponDiscount } from "@/lib/checkout-coupon-rules";

/**
 * @typedef {Object} ActiveCampaignCoupon
 * @property {string} id
 * @property {string} code
 * @property {"percent"|"fixed"} discountType
 * @property {number} discountValue
 */

/**
 * @typedef {Object} ActiveCampaign
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {Date} startsAt
 * @property {Date} endsAt
 * @property {string|null} bannerText
 * @property {boolean} bannerEnabled
 * @property {Record<string, number>|null} tierPriceOverrides
 * @property {string[]|null} entityMinerHotkeys
 * @property {ActiveCampaignCoupon} coupon
 */

/**
 * @typedef {Object} ActiveCampaignClient
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} startsAt
 * @property {string} endsAt
 * @property {string|null} bannerText
 * @property {boolean} bannerEnabled
 * @property {Record<string, number>|null} tierPriceOverrides
 * @property {string[]|null} entityMinerHotkeys
 * @property {ActiveCampaignCoupon} coupon
 */

/**
 * Resolves the active promotional campaign for a given tenant. Hyperscaled
 * is multi-tenant: a campaign targets a set of miner hotkeys
 * (`entity_miner_hotkeys`), and an empty / NULL array means it is site-wide.
 *
 * Lookup precedence:
 *   1. a campaign whose `entity_miner_hotkeys` contains `<hotkey>` (tenant-scoped)
 *   2. a site-wide campaign (empty / NULL `entity_miner_hotkeys`)
 *
 * @param {{ minerSlug?: string|null, minerHotkey?: string|null }} [opts]
 * @returns {Promise<ActiveCampaign | null>}
 */
export async function resolveActiveCampaign(opts = {}) {
  const db = await getDb();
  const now = new Date();

  let hotkey = opts.minerHotkey ?? null;
  if (!hotkey && opts.minerSlug) {
    const [m] = await db
      .select({ hotkey: entityMiners.hotkey })
      .from(entityMiners)
      .where(eq(entityMiners.slug, opts.minerSlug))
      .limit(1);
    hotkey = m?.hotkey ?? null;
  }

  const baseConds = [
    eq(promotionalCampaigns.status, "active"),
    lte(promotionalCampaigns.startsAt, now),
    gte(promotionalCampaigns.endsAt, now),
  ];

  // Site-wide campaigns store a NULL / empty target array.
  const isGlobal = sql`(${promotionalCampaigns.entityMinerHotkeys} IS NULL OR cardinality(${promotionalCampaigns.entityMinerHotkeys}) = 0)`;
  const tenantCond = hotkey
    ? or(
        sql`${promotionalCampaigns.entityMinerHotkeys} @> ARRAY[${hotkey}]::text[]`,
        isGlobal,
      )
    : isGlobal;

  const rows = await db
    .select({
      id: promotionalCampaigns.id,
      name: promotionalCampaigns.name,
      slug: promotionalCampaigns.slug,
      startsAt: promotionalCampaigns.startsAt,
      endsAt: promotionalCampaigns.endsAt,
      bannerText: promotionalCampaigns.bannerText,
      bannerEnabled: promotionalCampaigns.bannerEnabled,
      tierPriceOverrides: promotionalCampaigns.tierPriceOverrides,
      entityMinerHotkeys: promotionalCampaigns.entityMinerHotkeys,
      couponId: coupons.id,
      couponCode: coupons.code,
      couponType: coupons.discountType,
      couponValue: coupons.discountValue,
    })
    .from(promotionalCampaigns)
    .innerJoin(coupons, eq(coupons.id, promotionalCampaigns.couponId))
    .where(and(...baseConds, tenantCond))
    .limit(2);

  if (!rows.length) return null;

  // A tenant-scoped campaign (non-empty target array) wins over a site-wide one.
  const ranked = rows.sort((a, b) => {
    const aSpecific = a.entityMinerHotkeys && a.entityMinerHotkeys.length > 0 ? 0 : 1;
    const bSpecific = b.entityMinerHotkeys && b.entityMinerHotkeys.length > 0 ? 0 : 1;
    return aSpecific - bSpecific;
  });
  const row = ranked[0];

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    bannerText: row.bannerText,
    bannerEnabled: row.bannerEnabled,
    tierPriceOverrides: row.tierPriceOverrides ?? null,
    entityMinerHotkeys: row.entityMinerHotkeys ?? null,
    coupon: {
      id: row.couponId,
      code: row.couponCode,
      discountType: row.couponType,
      discountValue: Number(row.couponValue),
    },
  };
}

/**
 * Convert an active campaign for client serialization (Date -> ISO).
 *
 * @param {ActiveCampaign | null} campaign
 * @returns {ActiveCampaignClient | null}
 */
export function serializeActiveCampaign(campaign) {
  if (!campaign) return null;
  return {
    ...campaign,
    startsAt: campaign.startsAt.toISOString(),
    endsAt: campaign.endsAt.toISOString(),
  };
}

/**
 * Apply a campaign's pricing to a single tier. Returns `{ currentPrice,
 * originalPrice }` (USDC). When no campaign is active, both are equal.
 * Per-tier numeric overrides win over the linked coupon's discount.
 *
 * @param {number|string} accountSize
 * @param {number|string} listPriceUsdc
 * @param {ActiveCampaign | ActiveCampaignClient | null | undefined} campaign
 */
export function applyCampaignToTierPrice(accountSize, listPriceUsdc, campaign) {
  const original = Number(listPriceUsdc);
  if (!Number.isFinite(original)) {
    return { currentPrice: 0, originalPrice: 0 };
  }
  if (!campaign || original <= 0) {
    return { currentPrice: original, originalPrice: original };
  }

  const overrides = campaign.tierPriceOverrides ?? null;
  if (overrides && typeof overrides === "object") {
    const key = String(accountSize);
    const raw = overrides[key];
    if (raw != null && Number.isFinite(Number(raw))) {
      const override = Math.max(0, Number(raw));
      return { currentPrice: override, originalPrice: original };
    }
  }

  const { finalAmount } = computeCouponDiscount(
    campaign.coupon.discountType,
    campaign.coupon.discountValue,
    original,
  );
  return { currentPrice: finalAmount, originalPrice: original };
}
