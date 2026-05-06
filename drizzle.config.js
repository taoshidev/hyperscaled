import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://localhost:5432/hyperscaled";

export default defineConfig({
  schema: "./lib/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
