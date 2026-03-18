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
  return await db
    .select()
    .from(entityMiners)
    .where(eq(entityMiners.isActive, true));
}

export async function getTiersForMiner(hotkey) {
  return await db
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
