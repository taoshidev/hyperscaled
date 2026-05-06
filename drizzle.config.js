import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

import { buildDrizzleKitUrl } from "./lib/db/ssl.js";

config({ path: ".env.local" });

const rawConnectionString =
  process.env.DATABASE_URL ||
  "postgresql://localhost:5432/hyperscaled";

const connectionString = buildDrizzleKitUrl(rawConnectionString);

export default defineConfig({
  schema: "./lib/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
