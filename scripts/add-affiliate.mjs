import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const [, , slug, ...nameParts] = process.argv;
const name = nameParts.join(" ");

if (!slug || !name) {
  console.error("Usage: node scripts/add-affiliate.mjs <slug> <name>");
  console.error('Example: node scripts/add-affiliate.mjs strato "Strato"');
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`Invalid slug "${slug}": must match /^[a-z0-9-]+$/`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const isRemote =
  !connectionString.includes("127.0.0.1") && !connectionString.includes("localhost");

const pool = new pg.Pool({
  connectionString,
  ...(isRemote && { ssl: { rejectUnauthorized: false } }),
});

(async () => {
  const client = await pool.connect();
  try {
    const who = await client.query("SELECT current_user");
    console.log(`Connected as: ${who.rows[0].current_user}`);

    const result = await client.query(
      `INSERT INTO affiliates (slug, name, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id, slug, name, is_active, use_count, created_at`,
      [slug, name],
    );

    if (result.rows.length) {
      console.log("Inserted:", result.rows[0]);
    } else {
      const existing = await client.query(
        "SELECT id, slug, name, is_active, use_count FROM affiliates WHERE slug = $1",
        [slug],
      );
      console.log("Already exists (no-op):", existing.rows[0]);
    }
  } catch (err) {
    console.error("Insert failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
