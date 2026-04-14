import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

const rawConnectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5439/postgres";
const isRemote =
  !rawConnectionString.includes("127.0.0.1") && !rawConnectionString.includes("localhost");
const connectionString =
  isRemote && !/[?&]sslmode=/.test(rawConnectionString)
    ? `${rawConnectionString}${rawConnectionString.includes("?") ? "&" : "?"}sslmode=no-verify`
    : rawConnectionString;

export default defineConfig({
  schema: "./lib/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
