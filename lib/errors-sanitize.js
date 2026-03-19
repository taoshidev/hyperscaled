/**
 * Sanitize data before sending to error reporting services.
 * Strips secrets, masks PII, truncates long strings.
 * Pure function — no side effects.
 */

const SECRET_KEY_BLOCKLIST = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "credential",
  "credentials",
  "databaseurl",
  "database_url",
  "connectionstring",
  "connection_string",
  "privatekey",
  "private_key",
  "secretkey",
  "secret_key",
  "apptoken",
  "app_token",
  "webhooksecret",
  "webhook_secret",
]);

const MAX_STRING_LENGTH = 500;

// Match 0x followed by 40+ hex chars (EVM wallet/HL address)
const WALLET_RE = /0x[0-9a-fA-F]{40,}/g;

// Basic email pattern
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Lines that might contain env var values or connection strings
const SENSITIVE_LINE_RE =
  /process\.env|DATABASE_URL|postgresql:\/\/|mongodb(\+srv)?:\/\/|redis:\/\//i;

function maskWallet(str) {
  return str.replace(WALLET_RE, (addr) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  });
}

function maskEmail(str) {
  return str.replace(EMAIL_RE, (email) => {
    const [local, domain] = email.split("@");
    return `${local[0]}***@${domain}`;
  });
}

function sanitizeString(str) {
  if (typeof str !== "string") return str;

  // Truncate first so we don't process huge blobs
  let out = str.length > MAX_STRING_LENGTH ? str.slice(0, MAX_STRING_LENGTH) + "…" : str;

  // Scrub lines that look like they contain connection strings or env vars
  out = out
    .split("\n")
    .filter((line) => !SENSITIVE_LINE_RE.test(line))
    .join("\n");

  out = maskWallet(out);
  out = maskEmail(out);

  return out;
}

function isBlocklisted(key) {
  return SECRET_KEY_BLOCKLIST.has(key.toLowerCase().replace(/[-\s]/g, ""));
}

/**
 * Sentry beforeSend hook — sanitizes event data before it leaves the process.
 * Used by both instrumentation-client.js and instrumentation.node.js.
 */
export function sanitizeSentryEvent(event) {
  if (!event) return event;

  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((ex) => ({
      ...ex,
      value: ex.value ? sanitize(ex.value) : ex.value,
      stacktrace: ex.stacktrace
        ? { ...ex.stacktrace, frames: ex.stacktrace.frames?.slice(-20) }
        : ex.stacktrace,
    }));
  }

  if (event.extra) event.extra = sanitize(event.extra);
  if (event.user) event.user = sanitize(event.user);

  return event;
}

/**
 * Recursively sanitize an object, array, or primitive.
 * Returns a new value — never mutates input.
 */
export function sanitize(data, depth = 0) {
  // Prevent runaway recursion on deeply nested objects
  if (depth > 8) return "[truncated]";

  if (data === null || data === undefined) return data;

  if (typeof data === "string") return sanitizeString(data);

  if (typeof data === "number" || typeof data === "boolean") return data;

  if (Array.isArray(data)) {
    return data.slice(0, 20).map((item) => sanitize(item, depth + 1));
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: sanitizeString(data.message),
      // Stack traces can leak file paths and env values — scrub line by line
      stack: data.stack
        ? data.stack
            .split("\n")
            .filter((line) => !SENSITIVE_LINE_RE.test(line))
            .slice(0, 10)
            .join("\n")
        : undefined,
    };
  }

  if (typeof data === "object") {
    const out = {};
    for (const [key, value] of Object.entries(data)) {
      if (isBlocklisted(key)) {
        out[key] = "[redacted]";
      } else {
        out[key] = sanitize(value, depth + 1);
      }
    }
    return out;
  }

  return data;
}
