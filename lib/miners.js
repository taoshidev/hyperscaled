import { db } from "@/lib/db";
import { entityMiners, entityTiers } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const TIERS = [
  { label: "$25K", accountSize: 25000 },
  { label: "$50K", accountSize: 50000 },
  { label: "$100K", accountSize: 100000 },
];

export async function getMinerBySlug(slug) {
  const [miner] = await db
    .select()
    .from(entityMiners)
    .where(eq(entityMiners.slug, slug))
    .limit(1);
  return miner && miner.isActive ? miner : null;
}

export async function getAllActiveMiners() {
  return db
    .select()
    .from(entityMiners)
    .where(eq(entityMiners.isActive, true));
}

export async function getTiersForMiner(hotkey) {
  return db
    .select()
    .from(entityTiers)
    .where(eq(entityTiers.hotkey, hotkey))
    .orderBy(asc(entityTiers.accountSize));
}

export async function getMinerWithTiersBySlug(slug) {
  const miner = await getMinerBySlug(slug);
  if (!miner) return null;
  const tiers = await getTiersForMiner(miner.hotkey);
  const activeTiers = tiers.filter((t) => t.isActive);
  return {
    ...miner,
    tiers: activeTiers.map((t) => ({
      accountSize: t.accountSize,
      priceUsdc: Number(t.priceUsdc),
      profitSplit: t.profitSplit,
      label: TIERS.find((tier) => tier.accountSize === t.accountSize)?.label || `$${t.accountSize / 1000}K`,
    })),
  };
}

export async function getAllActiveMinersWithTiers() {
  const miners = await getAllActiveMiners();
  const results = [];
  for (const miner of miners) {
    const tiers = await getTiersForMiner(miner.hotkey);
    const activeTiers = tiers.filter((t) => t.isActive);
    results.push({
      ...miner,
      tiers: activeTiers.map((t) => ({
        accountSize: t.accountSize,
        priceUsdc: Number(t.priceUsdc),
        profitSplit: t.profitSplit,
        label: TIERS.find((tier) => tier.accountSize === t.accountSize)?.label || `$${t.accountSize / 1000}K`,
      })),
    });
  }
  return results;
}

function normalizePayoutCadence(days) {
  const known = {
    7: "weekly",
    14: "biweekly",
    30: "monthly",
  };
  return known[days] || `every_${days}_days`;
}

function serializeProfitSplit(profitSplit) {
  return {
    trader_pct: profitSplit,
    miner_pct: 100 - profitSplit,
  };
}

function serializePricingTier(tier) {
  return {
    account_size: tier.accountSize,
    cost: String(tier.priceUsdc),
    profit_split: serializeProfitSplit(tier.profitSplit),
  };
}

export function serializeMinerCatalog(miner) {
  const pricingTiers = (miner.tiers || []).map(serializePricingTier);
  return {
    name: miner.name,
    slug: miner.slug,
    pricing_tiers: pricingTiers,
    payout_cadence: normalizePayoutCadence(miner.payoutCadenceDays),
    available_account_sizes: pricingTiers.map((tier) => tier.account_size),
    brand_color: miner.color,
  };
}

export async function getMinerCatalogBySlug(slug) {
  const miner = await getMinerWithTiersBySlug(slug);
  if (!miner) return null;
  return serializeMinerCatalog(miner);
}

export async function getAllMinerCatalogEntries() {
  const miners = await getAllActiveMinersWithTiers();
  return miners.map(serializeMinerCatalog);
}
