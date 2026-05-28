import { isWsbSaleBannerActive } from "@/lib/wsb-sale-banner";

/** Vanta list prices when WSB flash sale is off — unchanged from pre–price-increase tiers */
const STANDARD_LIST_USDC = {
  1000: 0,
  5000: 59,
  10000: 109,
  25000: 239,
  50000: 499,
  100000: 799,
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
