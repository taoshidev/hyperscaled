/**
 * Maps a white-label brand id to the `entity_miners.slug` row used for DB pricing.
 * Jolly and beanstock share one operator; all other brands use their own slug.
 */
export function pricingMinerSlugForBrandId(brandId) {
  if (brandId == null || brandId === "hyperscaled") return "vanta";
  if (brandId === "jolly") return "beanstock";
  return brandId;
}
