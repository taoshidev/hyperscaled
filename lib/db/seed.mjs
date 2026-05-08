import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, ne, notInArray } from "drizzle-orm";
import { entityMiners, entityTiers, registrations } from "./schema.js";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/hyperscaled",
});

const db = drizzle(pool);

const USE_TESTNET = process.env.USE_TESTNET === "true";
const NETWORK = USE_TESTNET ? "testnet" : "mainnet";

const VANTA_API_URL_DEFAULTS = {
  testnet: "http://34.65.220.195:8088",
  mainnet: "https://entity-miner.mainnet.vantatrading.io",
};
const VANTA_API_URL =
  process.env.VANTA_API_URL ||
  process.env.PTN_API_URL ||
  VANTA_API_URL_DEFAULTS[NETWORK];

const VANTA_ENTITY_HOTKEY =
  process.env.VANTA_ENTITY_HOTKEY || process.env.PTN_ENTITY_HOTKEY || null;

const VANTA_USDC_WALLET = process.env.HYPERSCALED_USDC_WALLET || null;

const JOLLY_GREEN_USDC_WALLET = process.env.JOLLY_GREEN_USDC_WALLET || "0x0000000000000000000000000000000000000000";
const JOLLY_GREEN_HOTKEY = process.env.JOLLY_GREEN_HOTKEY || null;
const JOLLY_GREEN_API_URL = process.env.JOLLY_GREEN_API_URL || null;
const JOLLY_GREEN_API_KEY = process.env.JOLLY_GREEN_API_KEY || null;


if (VANTA_ENTITY_HOTKEY && !VANTA_USDC_WALLET) {
  throw new Error(
    "HYPERSCALED_USDC_WALLET is required when VANTA_ENTITY_HOTKEY is set. " +
      "Set it in .env.local (testnet) or your production env (mainnet)."
  );
}

const TIER_PRICES = [
  { accountSize: 1000, priceUsdc: "0.00" },
  { accountSize: 5000, priceUsdc: "59.00" },
  { accountSize: 10000, priceUsdc: "109.00" },
  { accountSize: 25000, priceUsdc: "239.00" },
  { accountSize: 50000, priceUsdc: "499.00" },
  { accountSize: 100000, priceUsdc: "799.00" },
];

const tiersFor = (profitSplit) =>
  TIER_PRICES.map((tier) => ({ ...tier, profitSplit }));

const MINERS = [
  {
    name: "Vanta Trading",
    slug: "vanta",
    hotkeys: {
      testnet: VANTA_ENTITY_HOTKEY,
      mainnet: VANTA_ENTITY_HOTKEY,
    },
    usdcWallet: VANTA_USDC_WALLET,
    apiUrl: VANTA_API_URL,
    apiKey: process.env.VANTA_API_KEY || process.env.PTN_API_KEY || null,
    color: "#3b82f6",
    payoutCadenceDays: 7,
    tiers: tiersFor(100),
  },
  {
    name: "Jolly Green Trading",
    slug: "jolly",
    hotkeys: {
      testnet: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", // Bob (dev)
      mainnet: null,
    },
    usdcWallet: "0x0000000000000000000000000000000000000000",
    apiUrl: "https://api.jollygreentrading.com",
    color: "#22c55e",
    payoutCadenceDays: 7,
    tiers: tiersFor(90),
  },
  {
    name: "Bitcast Trading",
    slug: "bitcast",
    hotkeys: {
      testnet: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y", // Charlie (dev)
      mainnet: null,
    },
    usdcWallet: "0x0000000000000000000000000000000000000000",
    apiUrl: "https://api.bitcasttrading.com",
    color: "#a855f7",
    payoutCadenceDays: 7,
    tiers: tiersFor(90),
  },
  // Beanstock white-label brand (added by upstream's Beanstock PR). The
  // marketing pages read tiers from `lib/brand.jsx`, but `/beanstock/register`
  // calls `getMinerBySlug("beanstock")` and needs a real DB row. Mainnet
  // values must be supplied by the Beanstock operator before going live.
  {
    name: "Beanstock Trading",
    slug: "beanstock",
    hotkeys: {
      testnet: "5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL", // Ferdie (dev)
      mainnet: JOLLY_GREEN_HOTKEY,
    },
    usdcWallet: JOLLY_GREEN_USDC_WALLET,
    apiUrl: JOLLY_GREEN_API_URL,
    apiKey: JOLLY_GREEN_API_KEY,
    color: "#22c55e",
    payoutCadenceDays: 30,
    tiers: tiersFor(100),
  },
  {
    name: "Talisman Trading",
    slug: "talisman",
    hotkeys: {
      testnet: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy", // Dave (dev)
      mainnet: null,
    },
    usdcWallet: "0x0000000000000000000000000000000000000000",
    apiUrl: "https://api.talismantrading.com",
    color: "#eab308",
    payoutCadenceDays: 7,
    tiers: tiersFor(85),
  },
  {
    name: "Zoku Trading",
    slug: "zoku",
    hotkeys: {
      testnet: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw", // Eve (dev)
      mainnet: null,
    },
    usdcWallet: "0x0000000000000000000000000000000000000000",
    apiUrl: "https://api.zokutrading.com",
    color: "#a855f7",
    payoutCadenceDays: 7,
    tiers: tiersFor(80),
  },
];

async function seed() {
  console.log(`Seeding database (network: ${NETWORK})...`);

  let seededCount = 0;
  let skippedCount = 0;
  let tierCount = 0;

  for (const miner of MINERS) {
    const hotkey = miner.hotkeys[NETWORK];
    if (!hotkey) {
      console.log(`  Skip:  ${miner.name} — no ${NETWORK} hotkey configured`);
      skippedCount += 1;
      continue;
    }

    const stale = await db
      .select({ hotkey: entityMiners.hotkey })
      .from(entityMiners)
      .where(
        and(eq(entityMiners.slug, miner.slug), ne(entityMiners.hotkey, hotkey))
      );

    for (const row of stale) {
      const refs = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(eq(registrations.minerHotkey, row.hotkey))
        .limit(1);
      if (refs.length > 0) {
        throw new Error(
          `Refusing to reseed slug "${miner.slug}" on ${NETWORK}: existing row ` +
            `for hotkey ${row.hotkey} has registrations. Resolve manually.`
        );
      }
      await db.delete(entityTiers).where(eq(entityTiers.hotkey, row.hotkey));
      await db.delete(entityMiners).where(eq(entityMiners.hotkey, row.hotkey));
      console.log(
        `  Cleared stale ${miner.slug} row (hotkey ${row.hotkey.slice(
          0,
          8
        )}...)`
      );
    }

    const { hotkeys: _, tiers, ...rest } = miner;
    const minerData = { ...rest, hotkey };

    await db
      .insert(entityMiners)
      .values(minerData)
      .onConflictDoUpdate({
        target: entityMiners.hotkey,
        set: {
          name: minerData.name,
          slug: minerData.slug,
          usdcWallet: minerData.usdcWallet,
          apiUrl: minerData.apiUrl,
          apiKey: minerData.apiKey ?? null,
          color: minerData.color,
          payoutCadenceDays: minerData.payoutCadenceDays,
          updatedAt: new Date(),
        },
      });

    console.log(`  Miner: ${miner.name} (${hotkey.slice(0, 8)}...)`);
    seededCount += 1;

    // Upsert tiers by natural key (hotkey, account_size). Unlike the
    // older "delete + re-insert" approach, this preserves row IDs,
    // created_at, and any admin-applied is_active overrides for tiers
    // that have not changed.
    for (const tier of tiers) {
      const [existing] = await db
        .select({
          id: entityTiers.id,
          priceUsdc: entityTiers.priceUsdc,
          profitSplit: entityTiers.profitSplit,
          isActive: entityTiers.isActive,
        })
        .from(entityTiers)
        .where(
          and(
            eq(entityTiers.hotkey, hotkey),
            eq(entityTiers.accountSize, tier.accountSize)
          )
        )
        .limit(1);

      if (existing) {
        const priceChanged =
          String(existing.priceUsdc) !== String(tier.priceUsdc);
        const splitChanged = existing.profitSplit !== tier.profitSplit;
        const wasInactive = existing.isActive === false;

        if (priceChanged || splitChanged || wasInactive) {
          await db
            .update(entityTiers)
            .set({
              priceUsdc: tier.priceUsdc,
              profitSplit: tier.profitSplit,
              isActive: true,
              updatedAt: new Date(),
            })
            .where(eq(entityTiers.id, existing.id));

          const reasons = [
            priceChanged && `price ${existing.priceUsdc} → ${tier.priceUsdc}`,
            splitChanged &&
              `split ${existing.profitSplit}% → ${tier.profitSplit}%`,
            wasInactive && "reactivated",
          ]
            .filter(Boolean)
            .join(", ");
          console.log(`    Update: $${tier.accountSize / 1000}K (${reasons})`);
        } else {
          console.log(
            `    Skip:   $${tier.accountSize / 1000}K — already $${
              tier.priceUsdc
            } USDC, ${tier.profitSplit}% split`
          );
        }
      } else {
        await db.insert(entityTiers).values({
          hotkey,
          accountSize: tier.accountSize,
          priceUsdc: tier.priceUsdc,
          profitSplit: tier.profitSplit,
        });
        console.log(
          `    Insert: $${tier.accountSize / 1000}K — $${
            tier.priceUsdc
          } USDC, ${tier.profitSplit}% split`
        );
      }
      tierCount += 1;
    }

    const seedSizes = tiers.map((t) => t.accountSize);
    const deactivated = await db
      .update(entityTiers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(entityTiers.hotkey, hotkey),
          eq(entityTiers.isActive, true),
          notInArray(entityTiers.accountSize, seedSizes)
        )
      )
      .returning({ accountSize: entityTiers.accountSize });

    for (const row of deactivated) {
      console.log(
        `    Deactivate: $${row.accountSize / 1000}K (no longer in seed)`
      );
    }
  }

  console.log(
    `\nSeed complete (${NETWORK}): ${seededCount} miners, ${tierCount} tiers (${skippedCount} skipped)`
  );
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
