import { drizzle } from "drizzle-orm/node-postgres";

import pg from "pg";

// Cloud SQL Connector + GoogleAuth are imported statically (not via a
// conditional dynamic import) so Next's Output File Tracing reliably bundles
// them into the Vercel serverless function. Under pnpm's symlinked
// node_modules, a dynamic import inside a rarely-hit branch was being dropped
// from the trace, causing "Cannot find package
// '@google-cloud/cloud-sql-connector'" at runtime. They stay external via
// `serverExternalPackages` in next.config.mjs; loading them in local dev (plain
// DATABASE_URL) is harmless since they're only instantiated on the Cloud SQL
// path below.
import { Connector } from "@google-cloud/cloud-sql-connector";
import { GoogleAuth } from "google-auth-library";

import * as schema from "./schema.js";

let _db;

function getServiceAccountCredentials() {
  const b64 = process.env.GCP_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("GCP_SERVICE_ACCOUNT_B64 is not set");

  const creds = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));

  // Normalize escaped newlines: if the key round-tripped through a single-line
  // env format, its PEM contains literal "\n" instead of real newlines, which
  // makes the signed JWT fail with "invalid_grant: Invalid JWT Signature".
  if (creds.private_key) {
    creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  }

  return creds;
}

async function createPool() {
  // Cloud SQL Connector path (production). When the instance name is set we
  // build the pool from the connector's socket options + DB_* credentials.
  if (process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME) {
    const credentials = getServiceAccountCredentials();
    const auth = new GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/sqlservice.admin"],
    });

    const connector = new Connector({ auth });
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME,
      ipType: "PUBLIC",
      authType: "PASSWORD",
    });

    return new pg.Pool({
      ...clientOpts,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 5,
    });
  }

  // Local/dev path: a plain connection string. Avoids building the Cloud SQL
  // connector (and its GCP auth) when it isn't configured.
  return new pg.Pool({
    connectionString:
      process.env.DATABASE_URL || "postgresql://localhost:5432/hyperscaled",
  });
}

export async function getDb() {
  if (!_db) {
    _db = drizzle(await createPool(), { schema });
  }
  return _db;
}
