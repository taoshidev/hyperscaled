/**
 * Maps a white-label brand id to the `entity_miners.slug` row used for DB pricing.
 * Beanstock and jolly share one operator; hyperfunded is the bitcast brand miner.
 */
export function pricingMinerSlugForBrandId(brandId) {
  if (brandId == null || brandId === "hyperscaled") return "vanta";
  if (brandId === "bitcast") return "hyperfunded";
  if (brandId === "jolly") return "beanstock";
  return brandId;
}
