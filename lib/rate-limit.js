/**
 * Edge-friendly rate limiter.
 *
 * Backed by Upstash Redis (REST) when `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` are configured. Falls back to a per-process
 * in-memory limiter for local dev and CI.
 *
 * Trust model:
 * - We pull the client identifier from headers we trust the proxy/CDN
 *   to set: `cf-connecting-ip` (Cloudflare) or
 *   `x-vercel-forwarded-for` (Vercel). The raw `x-forwarded-for` header
 *   is **deliberately** not consulted — it is trivially spoofable by
 *   any HTTP client.
 * - Routes that have a stronger identity (a wallet, an HL address, an
 *   API key) should pass that identifier in via `key` so abuse cannot
 *   be hidden behind a NAT.
 */

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const HAS_UPSTASH = Boolean(REST_URL && REST_TOKEN);

const localBuckets = new Map();
let lastSweep = 0;

function pruneLocal(now) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, entry] of localBuckets) {
    if (now - entry.start > entry.windowMs) localBuckets.delete(k);
  }
}

function localCheck({ key, limit, windowMs }) {
  const now = Date.now();
  pruneLocal(now);
  const entry = localBuckets.get(key);
  if (!entry || now - entry.start > windowMs) {
    localBuckets.set(key, { start: now, count: 1, windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - entry.start),
    };
  }
  return {
    ok: true,
    remaining: limit - entry.count,
    retryAfterMs: 0,
  };
}

async function upstashCheck({ key, limit, windowMs }) {
  // Atomic fixed-window: INCR then EXPIRE if first-write. We use a
  // pipeline to keep this to one round trip.
  const namespacedKey = `rl:${key}`;
  const pipeline = [
    ["INCR", namespacedKey],
    ["PEXPIRE", namespacedKey, String(windowMs), "NX"],
    ["PTTL", namespacedKey],
  ];

  const res = await fetch(`${REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Upstash error: ${res.status}`);
  }
  const json = await res.json();
  const count = Number(json?.[0]?.result ?? 0);
  const ttl = Number(json?.[2]?.result ?? windowMs);

  if (count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(ttl, 0),
    };
  }
  return {
    ok: true,
    remaining: Math.max(limit - count, 0),
    retryAfterMs: 0,
  };
}

/**
 * Check whether `key` is allowed to make another request inside the
 * fixed window. Returns `{ ok, remaining, retryAfterMs }`. Never
 * throws — falls back to the local limiter if the remote limiter
 * fails so a Redis outage does not take down the route.
 *
 * @param {object} opts
 * @param {string} opts.key Stable identifier (wallet, IP, etc.).
 * @param {number} opts.limit Max requests per window.
 * @param {number} opts.windowMs Window length in milliseconds.
 */
export async function checkRateLimit({ key, limit, windowMs }) {
  if (!HAS_UPSTASH) {
    return localCheck({ key, limit, windowMs });
  }
  try {
    return await upstashCheck({ key, limit, windowMs });
  } catch {
    return localCheck({ key, limit, windowMs });
  }
}

/**
 * Resolve a *trusted* client identifier from request headers. Returns
 * `null` when no trusted source is available (caller should fall back
 * to a route-level identifier instead of the raw IP).
 */
export function getTrustedClientId(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    null
  );
}

/** Test-only — clear the in-process bucket map. */
export function __resetRateLimit() {
  localBuckets.clear();
  lastSweep = 0;
}
