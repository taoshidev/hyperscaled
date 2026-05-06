import { getDb } from "@/lib/db";
import { entityMiners, entityTiers } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export const TIERS = [
  { label: "$25K", accountSize: 25000 },
  { label: "$50K", accountSize: 50000 },
  { label: "$100K", accountSize: 100000 },
];

function getTierLabel(accountSize) {
  return (
    TIERS.find((tier) => tier.accountSize === accountSize)?.label ||
    `$${accountSize / 1000}K`
  );
}

export async function getMinerBySlug(slug) {
  const db = await getDb();
  const [miner] = await db
    .select()
    .from(entityMiners)
    .where(eq(entityMiners.slug, slug))
    .limit(1);
  return miner && miner.isActive ? miner : null;
}

export async function getAllActiveMiners() {
  const db = await getDb();
  return await db
    .select()
    .from(entityMiners)
    .where(eq(entityMiners.isActive, true));
}

export async function getTiersForMiner(hotkey) {
  const db = await getDb();
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
      label: getTierLabel(t.accountSize),
    })),
  };
}

export async function getActiveTiersForMinerSlug(slug) {
  const db = await getDb();
  const rows = await db
    .select({
      accountSize: entityTiers.accountSize,
      priceUsdc: entityTiers.priceUsdc,
      profitSplit: entityTiers.profitSplit,
    })
    .from(entityTiers)
    .innerJoin(entityMiners, eq(entityTiers.hotkey, entityMiners.hotkey))
    .where(
      and(
        eq(entityMiners.slug, slug),
        eq(entityMiners.isActive, true),
        eq(entityTiers.isActive, true),
      ),
    )
    .orderBy(asc(entityTiers.accountSize));

  return rows.map((t) => ({
    accountSize: t.accountSize,
    priceUsdc: Number(t.priceUsdc),
    profitSplit: t.profitSplit,
    label: getTierLabel(t.accountSize),
  }));
}

/**
 * Public miner catalog: exposed via `GET /api/entity` and the SDK.
 *
 * SECURITY: this projection MUST omit any operator-only field.
 * Specifically NEVER include:
 *   - entityMiners.apiKey  — bearer token for the miner's backend
 *   - entityMiners.apiUrl  — backend gateway URL (internal infra)
 *
 * Server-side code that needs those fields imports `getMinerBySlug`
 * (which returns the raw row) and uses them only inside server-only
 * proxy paths under app/api/register/*. Those routes never echo the
 * fields back to the client.
 *
 * If you ever need to surface a new field on this catalog, add it to
 * the SELECT, the result-shape, and to `tests/unit/api-entity.test.js`
 * (which asserts the public allowlist).
 */
export async function getAllActiveMinersWithTiers() {
  const db = await getDb();
  const rows = await db
    .select({
      hotkey: entityMiners.hotkey,
      name: entityMiners.name,
      slug: entityMiners.slug,
      usdcWallet: entityMiners.usdcWallet,
      color: entityMiners.color,
      payoutCadenceDays: entityMiners.payoutCadenceDays,
      accountSize: entityTiers.accountSize,
      priceUsdc: entityTiers.priceUsdc,
      profitSplit: entityTiers.profitSplit,
    })
    .from(entityMiners)
    .leftJoin(
      entityTiers,
      and(
        eq(entityTiers.hotkey, entityMiners.hotkey),
        eq(entityTiers.isActive, true),
      ),
    )
    .where(eq(entityMiners.isActive, true))
    .orderBy(asc(entityMiners.name), asc(entityTiers.accountSize));

  const byHotkey = new Map();
  for (const row of rows) {
    if (!byHotkey.has(row.hotkey)) {
      byHotkey.set(row.hotkey, {
        hotkey: row.hotkey,
        name: row.name,
        slug: row.slug,
        usdcWallet: row.usdcWallet,
        color: row.color,
        payoutCadenceDays: row.payoutCadenceDays,
        tiers: [],
      });
    }

    if (row.accountSize != null) {
      byHotkey.get(row.hotkey).tiers.push({
        accountSize: row.accountSize,
        priceUsdc: Number(row.priceUsdc),
        profitSplit: row.profitSplit,
        label: getTierLabel(row.accountSize),
      });
    }
  }

  return Array.from(byHotkey.values());
}
