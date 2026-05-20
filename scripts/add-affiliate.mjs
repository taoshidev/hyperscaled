import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * Insert (or upsert) an affiliate row.
 *
 *   node scripts/add-affiliate.mjs <slug> "<name>" [--parent=<slug>] [--miner=<slug>]
 *
 * Examples:
 *   node scripts/add-affiliate.mjs jdoe "Jane Doe"
 *   node scripts/add-affiliate.mjs lunarcrush "LunarCrush" --miner=lunarcrush
 *   node scripts/add-affiliate.mjs lc-jdoe "Jane @ LunarCrush" --parent=lunarcrush
 */
function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [k, v] = arg.slice(2).split("=");
      flags[k] = v ?? true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const [slug, ...nameParts] = positional;
const name = nameParts.join(" ");
const parentSlug = typeof flags.parent === "string" ? flags.parent : null;
const minerSlug = typeof flags.miner === "string" ? flags.miner : null;

if (!slug || !name) {
  console.error(
    "Usage: node scripts/add-affiliate.mjs <slug> <name> [--parent=<slug>] [--miner=<slug>]",
  );
  console.error('Example: node scripts/add-affiliate.mjs jdoe "Jane Doe"');
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`Invalid slug "${slug}": must match /^[a-z0-9-]+$/`);
  process.exit(1);
}
if (parentSlug && !/^[a-z0-9-]+$/.test(parentSlug)) {
  console.error(`Invalid --parent slug "${parentSlug}"`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const isRemote =
  !connectionString.includes("127.0.0.1") &&
  !connectionString.includes("localhost");

const pool = new pg.Pool({
  connectionString,
  ...(isRemote && { ssl: { rejectUnauthorized: false } }),
});

(async () => {
  const client = await pool.connect();
  try {
    const who = await client.query("SELECT current_user");
    console.log(`Connected as: ${who.rows[0].current_user}`);

    let parentId = null;
    if (parentSlug) {
      const r = await client.query(
        "SELECT id FROM affiliates WHERE slug = $1",
        [parentSlug],
      );
      if (r.rows.length === 0) {
        console.error(`Parent affiliate "${parentSlug}" not found.`);
        process.exit(1);
      }
      parentId = r.rows[0].id;
    }

    let minerHotkey = null;
    if (minerSlug) {
      const r = await client.query(
        "SELECT hotkey FROM entity_miners WHERE slug = $1",
        [minerSlug],
      );
      if (r.rows.length === 0) {
        console.error(`Entity miner "${minerSlug}" not found.`);
        process.exit(1);
      }
      minerHotkey = r.rows[0].hotkey;
    }

    const result = await client.query(
      `INSERT INTO affiliates (slug, name, is_active, parent_affiliate_id, entity_miner_hotkey)
       VALUES ($1, $2, true, $3, $4)
       ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name,
             parent_affiliate_id = EXCLUDED.parent_affiliate_id,
             entity_miner_hotkey = EXCLUDED.entity_miner_hotkey,
             updated_at = now()
       RETURNING id, slug, name, is_active, use_count, parent_affiliate_id, entity_miner_hotkey, created_at`,
      [slug, name, parentId, minerHotkey],
    );

    console.log("Upserted:", result.rows[0]);
  } catch (err) {
    console.error("Insert failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
