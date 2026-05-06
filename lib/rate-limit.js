/**
 * In-process rate limiter.
 *
 * Trust model:
 * - Client identifier is pulled from headers we trust the proxy/CDN to set:
 *   `cf-connecting-ip` (Cloudflare) or `x-vercel-forwarded-for` (Vercel).
 *   The raw `x-forwarded-for` header is **deliberately** not consulted —
 *   it is trivially spoofable by any HTTP client.
 * - Routes that have a stronger identity (a wallet, an HL address, an
 *   API key) should pass that identifier in via `key` so abuse cannot
 *   be hidden behind a NAT.
 *
 * Note: limits are per-process. On multi-instance deploys (Vercel
 * serverless, etc.) each instance keeps its own counter, so the
 * effective limit is `instances * limit`. Move to a shared store
 * (Redis/Upstash) if/when stricter global limits are required.
 */

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

/**
 * Check whether `key` is allowed to make another request inside the
 * fixed window. Returns `{ ok, remaining, retryAfterMs }`.
 *
 * Async signature is preserved for forward-compat with a future
 * distributed backend; today the implementation is synchronous.
 *
 * @param {object} opts
 * @param {string} opts.key Stable identifier (wallet, IP, etc.).
 * @param {number} opts.limit Max requests per window.
 * @param {number} opts.windowMs Window length in milliseconds.
 */
export async function checkRateLimit({ key, limit, windowMs }) {
  return localCheck({ key, limit, windowMs });
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
