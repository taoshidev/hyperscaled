import { unstable_cache } from "next/cache";
import { getActiveTiersForMinerSlug } from "@/lib/miners";
import { PRICING_TIERS } from '@/lib/constants'

// Static display config per account size — only the fields not stored in the DB
const TIER_CONFIG = {
  25000: {
    id: 'tier-1',
    name: '$25K Account',
    accountSize: '$25,000',
    standardPrice: 299,
    profitTarget: '10%',
    profitTargetAmount: '$2,500',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$1,250',
    payoutCycle: 'Weekly',
    scalingPath: 'Up to $100K',
    timeLimit: 'None',
    cta: 'Start $25K Challenge',
    popular: false,
  },
  50000: {
    id: 'tier-2',
    name: '$50K Account',
    accountSize: '$50,000',
    standardPrice: 549,
    profitTarget: '10%',
    profitTargetAmount: '$5,000',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$2,500',
    payoutCycle: 'Weekly',
    scalingPath: 'Up to $100K',
    timeLimit: 'None',
    cta: 'Start $50K Challenge',
    popular: false,
  },
  100000: {
    id: 'tier-3',
    name: '$100K Account',
    accountSize: '$100,000',
    standardPrice: 999,
    profitTarget: '10%',
    profitTargetAmount: '$10,000',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$5,000',
    payoutCycle: 'Weekly',
    scalingPath: 'Up to $2.5M',
    timeLimit: 'None',
    cta: 'Start $100K Challenge',
    popular: true,
  },
}

/**
 * Fetch pricing tiers from the DB (Vanta miner), mapped to the display shape.
 * Falls back to the PRICING_TIERS constant if the DB is unavailable or empty.
 */
async function fetchPricingTiersFromDb() {
  const tiersFromDb = await getActiveTiersForMinerSlug("vanta");
  if (!tiersFromDb.length) return PRICING_TIERS;

  const tiers = tiersFromDb
    .filter((t) => TIER_CONFIG[t.accountSize])
    .sort((a, b) => a.accountSize - b.accountSize)
    .map((t) => ({
      ...TIER_CONFIG[t.accountSize],
      launchPrice: t.priceUsdc,
      profitSplit: `${t.profitSplit}%`,
    }));

  return tiers.length > 0 ? tiers : PRICING_TIERS;
}

const getCachedPricingTiers = unstable_cache(
  fetchPricingTiersFromDb,
  ["pricing-tiers-vanta"],
  {
    revalidate: 60,
    tags: ["pricing-tiers", "pricing-tiers:vanta"],
  },
);

export async function getPricingTiers() {
  try {
    return await getCachedPricingTiers();
  } catch {
    return PRICING_TIERS
  }
}
