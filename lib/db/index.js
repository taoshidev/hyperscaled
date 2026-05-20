import { drizzle } from "drizzle-orm/node-postgres";

import pg from "pg";
import * as schema from "./schema.js";

let _db;

function getServiceAccountCredentials() {
  const b64 = process.env.GCP_SERVICE_ACCOUNT_B64;

  if (!b64) throw new Error('GCP_SERVICE_ACCOUNT_B64 is not set');

  const json = Buffer.from(b64, 'base64').toString('utf-8');

  return JSON.parse(json);
}

export async function getDb() {
  if (!_db) {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://localhost:5432/hyperscaled";
    let pool = new pg.Pool({ connectionString });

    if (process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME) {
      // Do not use webpackIgnore here — it hides these from output file tracing on Vercel,
      // causing ERR_MODULE_NOT_FOUND at runtime. serverExternalPackages keeps them external.
      const { Connector } = await import("@google-cloud/cloud-sql-connector");
      const { GoogleAuth } = await import("google-auth-library");

      const credentials = getServiceAccountCredentials();
      const auth = new GoogleAuth({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/sqlservice.admin'],
      });

      const connector = new Connector({ auth });

      const clientOpts = await connector.getOptions({
        instanceConnectionName: process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME,
        ipType: 'PUBLIC',
        authType: 'PASSWORD',
      });

      pool = new pg.Pool({
        ...clientOpts,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        max: 5,
      });
    }

    _db = drizzle(pool, { schema });
  }

  return _db;
}

