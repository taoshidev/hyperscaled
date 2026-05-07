import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";
import { cwd } from "node:process";

loadEnvConfig(cwd());

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required.");
}

export default defineConfig({
  schema: "./lib/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
