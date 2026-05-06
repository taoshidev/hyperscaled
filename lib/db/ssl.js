/**
 * Resolve the SSL/TLS configuration for the Postgres pool.
 *
 * Defaults are conservative:
 *   - Local connections (127.0.0.1 / localhost / unix sockets) → no SSL.
 *   - Remote connections → require TLS *with verification*.
 *
 * To verify the server cert in production, supply ONE of:
 *   - DATABASE_CA_CERT       — PEM string in the env var
 *   - DATABASE_CA_CERT_PATH  — filesystem path to a PEM file (read once)
 *
 * For local dev / CI against a self-signed Postgres, set
 * `DATABASE_SSL_INSECURE=true` to fall back to the legacy
 * `rejectUnauthorized: false` behavior. This must never be set in
 * production — `getPgSslConfig` will throw at startup if it sees the
 * insecure flag combined with `NODE_ENV=production`.
 */

import { readFileSync } from "fs";

let cachedCa = null;

function loadCaPem() {
  if (cachedCa !== null) return cachedCa;

  const inline = process.env.DATABASE_CA_CERT;
  if (inline && inline.trim().length > 0) {
    cachedCa = inline;
    return cachedCa;
  }

  const path = process.env.DATABASE_CA_CERT_PATH;
  if (path) {
    try {
      cachedCa = readFileSync(path, "utf8");
      return cachedCa;
    } catch (err) {
      throw new Error(
        `DATABASE_CA_CERT_PATH=${path} could not be read: ${err.message}`,
      );
    }
  }

  cachedCa = "";
  return cachedCa;
}

function isLocalConnectionString(connectionString) {
  if (!connectionString) return true;
  return (
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("localhost") ||
    connectionString.startsWith("postgresql://?host=") ||
    /[?&]host=\/(?:[^&]+)/.test(connectionString)
  );
}

/**
 * Returns either an `ssl` object suitable for `new pg.Pool({ ssl })`, or
 * `false` to skip SSL entirely (local dev). Throws if the configuration
 * is unsafe for the current environment.
 */
export function getPgSslConfig(connectionString) {
  if (isLocalConnectionString(connectionString)) {
    return false;
  }

  const ca = loadCaPem();
  if (ca) {
    return { ca, rejectUnauthorized: true };
  }

  if (process.env.DATABASE_SSL_INSECURE === "true") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DATABASE_SSL_INSECURE=true is not permitted when NODE_ENV=production. " +
          "Provide DATABASE_CA_CERT or DATABASE_CA_CERT_PATH instead.",
      );
    }
    return { rejectUnauthorized: false };
  }

  throw new Error(
    "Remote DATABASE_URL requires TLS verification. Set DATABASE_CA_CERT " +
      "(PEM contents) or DATABASE_CA_CERT_PATH (file path), or set " +
      "DATABASE_SSL_INSECURE=true for local/CI use only.",
  );
}

/**
 * Build a Drizzle Kit-friendly connection string. Drizzle Kit reads
 * `dbCredentials.url` and does not accept a separate `ssl` object, so
 * when we have a CA we still need to mutate the URL. When we do not
 * have a CA, append the explicit `sslmode=…` so `node-postgres`/`pg`
 * inside drizzle-kit picks up the right behavior.
 */
export function buildDrizzleKitUrl(connectionString) {
  if (isLocalConnectionString(connectionString)) {
    return connectionString;
  }

  if (/[?&]sslmode=/.test(connectionString)) {
    return connectionString;
  }

  const ca = loadCaPem();
  const sslmode = ca
    ? "verify-full"
    : process.env.DATABASE_SSL_INSECURE === "true"
      ? "no-verify"
      : "require";

  const sep = connectionString.includes("?") ? "&" : "?";
  return `${connectionString}${sep}sslmode=${sslmode}`;
}

/** Test-only — clear the in-process CA cache. */
export function __resetSslCache() {
  cachedCa = null;
}
