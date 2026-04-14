import pg from "pg";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

config({ path: ".env.local" });

const migrationPath = resolve(process.argv[2] || "drizzle/0001_talented_nighthawk.sql");
const sql = readFileSync(migrationPath, "utf-8");

const statements = sql
  .split(/-->\s*statement-breakpoint/)
  .map((s) => s.trim())
  .filter(Boolean);

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
    console.log(`Applying ${statements.length} statement(s) from ${migrationPath}`);

    await client.query("BEGIN");
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`  [${i + 1}/${statements.length}] ${stmt.split("\n")[0].slice(0, 80)}...`);
      await client.query(stmt);
    }
    await client.query("COMMIT");
    console.log("Migration applied successfully.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Migration failed, rolled back:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
