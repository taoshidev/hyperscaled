import { config } from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { entityMiners, entityTiers } from "./schema.js";

config({ path: ".env.local" });

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:5439/postgres",
});

const db = drizzle(pool);

// Well-known Substrate dev addresses (Alice through Eve)
const MINERS = [
  {
    hotkey: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // Alice
    name: "Vanta Trading",
    slug: "vanta",
    usdcWallet: "0xBab75f99F42A575Af937cD1c25E851C2cc42D42d",
    apiUrl: "http://34.65.220.195:8088",
    apiKey: process.env.VANTA_API_KEY || null,
    color: "#3b82f6",
    payoutCadenceDays: 7,
    tiers: [
      { accountSize: 25000, priceUsdc: "0.1", profitSplit: 100 },
      { accountSize: 50000, priceUsdc: "0.1", profitSplit: 100 },
      { accountSize: 100000, priceUsdc: "0.1", profitSplit: 100 },
    ],
  },
  {
    hotkey: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", // Bob
    name: "Jolly Green Trading",
    slug: "jolly",
    usdcWallet: "0x0000000000000000000000000000000000000000",
    apiUrl: "https://api.jollygreentrading.com",
    color: "#22c55e",
    payoutCadenceDays: 7,
    tiers: [
      { accountSize: 25000, priceUsdc: "0.1", profitSplit: 90 },
      { accountSize: 50000, priceUsdc: "0.1", profitSplit: 90 },
      { accountSize: 100000, priceUsdc: "0.1", profitSplit: 90 },
    ],
  },
  {
    hotkey: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y", // Charlie
    name: "Bitcast Trading",
    slug: "bitcast",
    usdcWallet: "0x0000000000000000000000000000000000000000",
    apiUrl: "https://api.bitcasttrading.com",
    color: "#a855f7",
    payoutCadenceDays: 7,
    tiers: [
      { accountSize: 25000, priceUsdc: "0.1", profitSplit: 90 },
      { accountSize: 50000, priceUsdc: "0.1", profitSplit: 90 },
      { accountSize: 100000, priceUsdc: "0.1", profitSplit: 90 },
    ],
  },
  {
    hotkey: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy", // Dave
    name: "Talisman Trading",
    slug: "talisman",
    usdcWallet: "0x0000000000000000000000000000000000000000",
    apiUrl: "https://api.talismantrading.com",
    color: "#eab308",
    payoutCadenceDays: 7,
    tiers: [
      { accountSize: 25000, priceUsdc: "0.1", profitSplit: 85 },
      { accountSize: 50000, priceUsdc: "0.1", profitSplit: 85 },
      { accountSize: 100000, priceUsdc: "0.1", profitSplit: 85 },
    ],
  },
  {
    hotkey: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw", // Eve
    name: "Zoku Trading",
    slug: "zoku",
    usdcWallet: "0x0000000000000000000000000000000000000000",
    apiUrl: "https://api.zokutrading.com",
    color: "#a855f7",
    payoutCadenceDays: 7,
    tiers: [
      { accountSize: 25000, priceUsdc: "0.1", profitSplit: 80 },
      { accountSize: 50000, priceUsdc: "0.1", profitSplit: 80 },
      { accountSize: 100000, priceUsdc: "0.1", profitSplit: 80 },
    ],
  },
];

async function seed() {
  console.log("Seeding database...");

  for (const miner of MINERS) {
    const { tiers, ...minerData } = miner;

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

    console.log(`  Miner: ${miner.name} (${miner.hotkey.slice(0, 8)}...)`);

    await db.delete(entityTiers).where(eq(entityTiers.hotkey, miner.hotkey));

    for (const tier of tiers) {
      await db
        .insert(entityTiers)
        .values({
          hotkey: miner.hotkey,
          accountSize: tier.accountSize,
          priceUsdc: tier.priceUsdc,
          profitSplit: tier.profitSplit,
        });

      console.log(
        `    Tier: $${tier.accountSize / 1000}K — $${tier.priceUsdc} USDC — ${tier.profitSplit}% split`,
      );
    }
  }

  console.log("\nSeed complete: 5 miners, 15 tiers");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
