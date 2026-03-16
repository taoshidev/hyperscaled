import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

let _db;

export function getDb() {
  if (!_db) {
    const pool = new pg.Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@127.0.0.1:5439/postgres",
    });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

// Keep the named export for existing imports — lazy-initialized on first access
export const db = new Proxy(
  {},
  {
    get(_, prop) {
      return getDb()[prop];
    },
  },
);
