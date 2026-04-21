import pg from "pg";
import { config } from "dotenv";

config({ path: "/home/rizzo/hyperscaled/.env.local" });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const miners = await pool.query(
  "SELECT hotkey, name, slug, api_url, usdc_wallet, is_active, (api_key IS NOT NULL) AS has_api_key FROM entity_miners ORDER BY is_active DESC, slug"
);
console.log("MINERS:");
miners.rows.forEach((m) => console.log(JSON.stringify(m)));

const tiers = await pool.query(
  "SELECT hotkey, account_size, price_usdc, profit_split, is_active FROM entity_tiers WHERE is_active = true ORDER BY hotkey, account_size"
);
console.log("\nTIERS (active):");
tiers.rows.forEach((t) => console.log(JSON.stringify(t)));

const regs = await pool.query(
  "SELECT id, user_id, miner_hotkey, hl_address, account_size, payout_address, tier_index, price_usdc, tx_hash, status, created_at FROM registrations WHERE hl_address = $1",
  ["0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1"]
);
console.log("\nEXISTING REGISTRATIONS for target:");
regs.rows.forEach((r) => console.log(JSON.stringify(r)));

await pool.end();
