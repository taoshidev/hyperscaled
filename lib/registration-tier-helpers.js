// Shared tier classification for registration caps (wizard + marketing pricing).
// Keeps "free" detection aligned between API-shaped tiers (promoPrice) and
// marketing tiers (launchPrice).

export function isFreeTierForRegistration(tier) {
  if (!tier) return false;
  if (tier.id === "free") return true;
  const promo = Number(
    tier.promoPrice != null ? tier.promoPrice : tier.launchPrice,
  );
  if (Number.isFinite(promo) && promo === 0) {
    const full = Number(
      tier.fullPrice != null ? tier.fullPrice : tier.standardPrice,
    );
    if (!Number.isFinite(full) || full === 0) return true;
  }
  return false;
}

/** True if this tier cannot be started under the current capacity snapshot. */
export function tierBlockedForCaps(tier, freeAtCapacity, paidAtCapacity) {
  if (!tier) return false;
  const free = isFreeTierForRegistration(tier);
  return (free && freeAtCapacity) || (!free && paidAtCapacity);
}
