import pg from "pg";
import { getAddress, isAddress } from "viem";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, ne, notInArray } from "drizzle-orm";
import {
  entityMiners,
  entityTiers,
  registrations,
  commandCenterStaff,
  affiliates,
} from "./schema.js";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/hyperscaled",
});

const db = drizzle(pool);

const USE_TESTNET = process.env.USE_TESTNET === "true";
const NETWORK = USE_TESTNET ? "testnet" : "mainnet";

const VANTA_API_URL_DEFAULTS = {
  testnet: "https://entity-miner.testnet.vantatrading.io",
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

const HYPERFUNDED_USDC_WALLET = process.env.HYPERFUNDED_USDC_WALLET || "0x0000000000000000000000000000000000000000";
const HYPERFUNDED_HOTKEY = process.env.HYPERFUNDED_HOTKEY || null;
const HYPERFUNDED_API_URL = process.env.HYPERFUNDED_API_URL || null;
const HYPERFUNDED_API_KEY = process.env.HYPERFUNDED_API_KEY || null;


if (VANTA_ENTITY_HOTKEY && !VANTA_USDC_WALLET) {
  throw new Error(
    "HYPERSCALED_USDC_WALLET is required when VANTA_ENTITY_HOTKEY is set. " +
      "Set it in .env.local (testnet) or your production env (mainnet)."
  );
}

const STANDARD_TIER_PRICES = [
  { accountSize: 1000, priceUsdc: "0.00" },
  { accountSize: 5000, priceUsdc: "74.00" },
  { accountSize: 10000, priceUsdc: "135.00" },
  { accountSize: 25000, priceUsdc: "309.00" },
  { accountSize: 50000, priceUsdc: "579.00" },
  { accountSize: 100000, priceUsdc: "999.00" },
];

const CUT_10_TIER_PRICES = [
  { accountSize: 1000, priceUsdc: "0.00" },
  { accountSize: 5000, priceUsdc: "67.00" },
  { accountSize: 10000, priceUsdc: "119.00" },
  { accountSize: 25000, priceUsdc: "279.00" },
  { accountSize: 50000, priceUsdc: "519.00" },
  { accountSize: 100000, priceUsdc: "899.00" },
];

const VANTA_PROMO_TIER_PRICES = [
  { accountSize: 1000, priceUsdc: "0.00" },
  { accountSize: 5000, priceUsdc: "29.00" },
  { accountSize: 10000, priceUsdc: "54.00" },
  { accountSize: 25000, priceUsdc: "119.00" },
  { accountSize: 50000, priceUsdc: "249.00" },
  { accountSize: 100000, priceUsdc: "399.00" },
];

const tiersFor = (profitSplit, prices = STANDARD_TIER_PRICES) =>
  prices.map((tier) => ({ ...tier, profitSplit }));

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
    tiers: tiersFor(100, STANDARD_TIER_PRICES),
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
    // Same operator + price list as beanstock (white-label brand).
    tiers: tiersFor(90, CUT_10_TIER_PRICES).map((t) =>
      t.accountSize === 1000
        ? { ...t, maxFreeRegistrations: 100 }
        : t,
    ),
  },
  {
    name: "Bitcast Trading",
    slug: "bitcast",
    hotkeys: {
      testnet: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y", // Charlie (dev)
      mainnet: HYPERFUNDED_HOTKEY,
    },
    usdcWallet: HYPERFUNDED_USDC_WALLET,
    apiUrl: HYPERFUNDED_API_URL,
    apiKey: HYPERFUNDED_API_KEY,
    color: "#a855f7",
    payoutCadenceDays: 7,
    // Standard list + $1K free (explicit — same as tiersFor(90) default prices)
    tiers: tiersFor(90, STANDARD_TIER_PRICES).map((t) =>
      t.accountSize === 1000
        ? { ...t, maxFreeRegistrations: 100 }
        : t,
    ),
  },
  // Beanstock white-label brand. Mainnet values supplied by the operator.
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
    tiers: tiersFor(90, CUT_10_TIER_PRICES).map((t) =>
      t.accountSize === 1000
        ? { ...t, maxFreeRegistrations: 100 }
        : t,
    ),
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

    if (!miner.apiUrl || String(miner.apiUrl).trim() === "") {
      console.log(
        `  Skip:  ${miner.name} — apiUrl not configured (set the partner's *_API_URL env var)`,
      );
      skippedCount += 1;
      continue;
    }
    if (!miner.usdcWallet || String(miner.usdcWallet).trim() === "") {
      console.log(
        `  Skip:  ${miner.name} — usdcWallet not configured`,
      );
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

    // Upsert by (hotkey, account_size) to preserve row IDs and admin overrides.
    for (const tier of tiers) {
      const [existing] = await db
        .select({
          id: entityTiers.id,
          priceUsdc: entityTiers.priceUsdc,
          profitSplit: entityTiers.profitSplit,
          isActive: entityTiers.isActive,
          maxFreeRegistrations: entityTiers.maxFreeRegistrations,
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
        const capChanged =
          (existing.maxFreeRegistrations ?? null) !==
          (tier.maxFreeRegistrations ?? null);
        const wasInactive = existing.isActive === false;

        if (priceChanged || splitChanged || capChanged || wasInactive) {
          await db
            .update(entityTiers)
            .set({
              priceUsdc: tier.priceUsdc,
              profitSplit: tier.profitSplit,
              isActive: true,
              maxFreeRegistrations: tier.maxFreeRegistrations ?? null,
              updatedAt: new Date(),
            })
            .where(eq(entityTiers.id, existing.id));

          const reasons = [
            priceChanged && `price ${existing.priceUsdc} → ${tier.priceUsdc}`,
            splitChanged &&
              `split ${existing.profitSplit}% → ${tier.profitSplit}%`,
            capChanged &&
              `free cap ${existing.maxFreeRegistrations ?? "none"} → ${
                tier.maxFreeRegistrations ?? "none"
              }`,
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
          maxFreeRegistrations: tier.maxFreeRegistrations ?? null,
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

  await seedCommandCenterStaff();
  await seedAffiliates();

  console.log(
    `\nSeed complete (${NETWORK}): ${seededCount} miners, ${tierCount} tiers (${skippedCount} skipped)`
  );
  await pool.end();
}

const AFFILIATES = [
  { slug: "hyperfunded", name: "Hyperfunded", minerSlug: "bitcast" },
  { slug: "beanstock", name: "Beanstock Trading", minerSlug: "beanstock" },
  { slug: "lunarcrush", name: "LunarCrush", minerSlug: null },
];

async function seedAffiliates() {
  if (AFFILIATES.length === 0) {
    console.log("\nAffiliates: none configured — skipping");
    return;
  }
  console.log(`\nAffiliates: ${AFFILIATES.length} configured`);

  for (const aff of AFFILIATES) {
    let minerHotkey = null;
    if (aff.minerSlug) {
      const [miner] = await db
        .select({ hotkey: entityMiners.hotkey })
        .from(entityMiners)
        .where(eq(entityMiners.slug, aff.minerSlug))
        .limit(1);
      if (miner) {
        minerHotkey = miner.hotkey;
      } else {
        console.log(
          `  Warn:  ${aff.slug} → entity_miners slug "${aff.minerSlug}" not found yet — leaving unlinked`
        );
      }
    }

    const [existing] = await db
      .select({
        id: affiliates.id,
        name: affiliates.name,
        entityMinerHotkey: affiliates.entityMinerHotkey,
        isActive: affiliates.isActive,
      })
      .from(affiliates)
      .where(eq(affiliates.slug, aff.slug))
      .limit(1);

    if (!existing) {
      await db.insert(affiliates).values({
        slug: aff.slug,
        name: aff.name,
        entityMinerHotkey: minerHotkey,
      });
      console.log(
        `  Insert: ${aff.slug} (${aff.name}${minerHotkey ? ` → miner ${minerHotkey.slice(0, 8)}…` : ""})`
      );
      continue;
    }

    const nameChanged = existing.name !== aff.name;
    const minerChanged = existing.entityMinerHotkey !== minerHotkey;
    const wasInactive = existing.isActive === false;

    if (nameChanged || minerChanged || wasInactive) {
      await db
        .update(affiliates)
        .set({
          name: aff.name,
          entityMinerHotkey: minerHotkey,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(affiliates.id, existing.id));
      const reasons = [
        nameChanged && `name "${existing.name}" → "${aff.name}"`,
        minerChanged &&
          `miner ${existing.entityMinerHotkey ?? "none"} → ${minerHotkey ?? "none"}`,
        wasInactive && "reactivated",
      ]
        .filter(Boolean)
        .join(", ");
      console.log(`  Update: ${aff.slug} (${reasons})`);
    } else {
      console.log(`  Skip:   ${aff.slug} — already up to date`);
    }
  }
}

function parseStaffEnv(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [walletPart, labelPart, rolePart] = entry.split(":").map((s) => s?.trim() ?? "");
      if (!walletPart || !isAddress(walletPart)) {
        console.warn(`  Skip staff entry: not a valid address (${entry})`);
        return null;
      }
      const role = rolePart === "super_admin" ? "super_admin" : "admin";
      return {
        wallet: getAddress(walletPart),
        label: labelPart || null,
        role,
      };
    })
    .filter(Boolean);
}

async function seedCommandCenterStaff() {
  const entries = parseStaffEnv(process.env.COMMAND_CENTER_STAFF_WALLETS);
  if (entries.length === 0) {
    console.log("\nCommand Center staff: COMMAND_CENTER_STAFF_WALLETS unset — skipping");
    return;
  }
  console.log(`\nCommand Center staff: ${entries.length} wallet(s)`);
  for (const entry of entries) {
    const [existing] = await db
      .select({
        wallet: commandCenterStaff.wallet,
        role: commandCenterStaff.role,
        label: commandCenterStaff.label,
      })
      .from(commandCenterStaff)
      .where(eq(commandCenterStaff.wallet, entry.wallet))
      .limit(1);
    if (!existing) {
      await db.insert(commandCenterStaff).values({
        wallet: entry.wallet,
        role: entry.role,
        label: entry.label,
      });
      console.log(`  Insert: ${entry.wallet} (${entry.role}${entry.label ? ` — ${entry.label}` : ""})`);
      continue;
    }
    if (existing.role !== entry.role || existing.label !== entry.label) {
      await db
        .update(commandCenterStaff)
        .set({ role: entry.role, label: entry.label, updatedAt: new Date() })
        .where(eq(commandCenterStaff.wallet, entry.wallet));
      console.log(`  Update: ${entry.wallet} (role/label changed)`);
    } else {
      console.log(`  Skip:   ${entry.wallet} (${entry.role}) — already up to date`);
    }
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
