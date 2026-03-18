import { Connector } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';
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
    let pool = new pg.Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@127.0.0.1:5439/postgres",
    });

    if (process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME) {
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

export const db = await getDb();

