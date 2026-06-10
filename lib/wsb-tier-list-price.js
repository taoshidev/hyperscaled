/**
 * Returns the canonical USDC list price for a tier. The DB row may store
 * promotional/legacy prices for some miners; we always normalize back to
 * the brand-standard list price for vanta so the storefront strikethrough
 * (display) and registration (checkout) agree on the "original price".
 *
 * Promotional discounts on top of this list price are now driven by the
 * `promotional_campaigns` table — see `lib/campaign-pricing.js`.
 */

const STANDARD_LIST_USDC = {
  1000: 0,
  5000: 74,
  10000: 135,
  25000: 309,
  50000: 579,
  100000: 999,
};

export function listPriceUsdcFromDbTier(minerSlug, accountSize, dbPriceUsdc) {
  const n = Number(dbPriceUsdc);
  if (minerSlug !== "vanta") return n;
  const std = STANDARD_LIST_USDC[accountSize];
  return std !== undefined ? std : n;
}
