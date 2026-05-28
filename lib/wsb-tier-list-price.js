import { isWsbSaleBannerActive } from "@/lib/wsb-sale-banner";

/** Standard list prices (USDC) — aligns with STANDARD_TIER_PRICES in lib/db/seed.mjs */
const STANDARD_LIST_USDC = {
  1000: 0,
  5000: 74,
  10000: 135,
  25000: 309,
  50000: 579,
  100000: 999,
};

/**
 * Vanta seed may store WSB promo rows. When the flash sale is off, expose
 * standard list prices for display and checkout. Other miners keep DB prices.
 */
export function listPriceUsdcFromDbTier(minerSlug, accountSize, dbPriceUsdc) {
  const n = Number(dbPriceUsdc);
  if (minerSlug !== "vanta") return n;
  if (isWsbSaleBannerActive()) return n;
  const std = STANDARD_LIST_USDC[accountSize];
  return std !== undefined ? std : n;
}
