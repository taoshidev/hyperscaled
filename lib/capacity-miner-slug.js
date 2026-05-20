export function capacityMinerSlugForBrandId(brandId) {
  if (brandId == null || brandId === "hyperscaled") return "vanta";
  return brandId;
}
