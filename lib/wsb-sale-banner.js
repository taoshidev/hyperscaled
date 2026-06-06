/**
 * Legacy env-flag for the WSB flash sale banner. The banner is now driven by
 * the `promotional_campaigns` table — see `lib/campaign-pricing.js` and
 * `components/marketing/PromoBanner.jsx`.
 *
 * Kept as a stub so any lingering callers compile; always returns false so
 * server-side branches that gated on it become inert.
 *
 * @deprecated Use `resolveActiveCampaign` from `@/lib/campaign-pricing`.
 */
export function isWsbSaleBannerActive() {
  return false;
}
