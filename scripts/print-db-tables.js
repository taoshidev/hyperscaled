/**
 * Pretty-print all public base tables: columns, row counts, and rows.
 *
 * Run (from repo root):
 *   node --env-file=.env.local scripts/print-db-tables.js
 *
 * Optional:
 *   ROW_LIMIT=50 node --env-file=.env.local scripts/print-db-tables.js
 */

const pg = require("pg");

const ROW_LIMIT = Math.max(1, parseInt(process.env.ROW_LIMIT || "500", 10) || 500);

function cell(v) {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "object" && !(v instanceof Buffer)) {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return v;
}

function rowPlain(obj) {
  const o = {};
  for (const [k, v] of Object.entries(obj)) {
    o[k] = cell(v);
  }
  return o;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Missing DATABASE_URL (use: node --env-file=.env.local scripts/print-db-tables.js)");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: url });
  try {
    const { rows: tables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (!tables.length) {
      console.log("No public base tables found.");
      return;
    }

    for (const { table_name: name } of tables) {
      const q = (ident) => `"${String(ident).replace(/"/g, '""')}"`;

      const { rows: cols } = await pool.query(
        `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `,
        [name],
      );

      const {
        rows: [{ total }],
      } = await pool.query(`SELECT COUNT(*)::bigint AS total FROM ${q(name)}`);

      const { rows: data } = await pool.query(
        `SELECT * FROM ${q(name)} LIMIT ${ROW_LIMIT}`,
      );

      const sep = "=".repeat(72);
      console.log(`\n${sep}`);
      console.log(`TABLE: ${name}`);
      console.log(`Rows: ${total} (showing up to ${ROW_LIMIT})`);
      console.log(sep);

      console.log(
        "Columns:\n  " +
          cols.map((c) => `${c.column_name} ${c.data_type}${c.is_nullable === "YES" ? " NULL" : ""}`).join("\n  "),
      );

      console.log("\nData:");
      if (!data.length) {
        console.log("  (empty)");
        continue;
      }
      const plain = data.map(rowPlain);
      console.table(plain);
    }

    console.log("\n");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
