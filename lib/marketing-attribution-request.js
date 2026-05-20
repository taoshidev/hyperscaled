/** Used by root `proxy.js` to suppress duplicate attribution for one user action. */

import { getTrustedClientId } from "@/lib/rate-limit.js";

export const ATTRIBUTION_BURST_WINDOW_MS = 600;

const attributionBurstSeen = new Map();

/** Next/link prefetch / RSC fetches replay the landing URL — must not mint clicks. */
export function isAuxiliaryMarketingRequest(request) {
  if (request.method !== "GET") return true;
  const u = request.nextUrl;
  if (u.searchParams.has("_rsc")) return true;
  const h = request.headers;
  if (
    (h.get("next-router-prefetch") || h.get("Next-Router-Prefetch")) === "1"
  ) {
    return true;
  }
  const purpose = (h.get("sec-fetch-purpose") || "").toLowerCase();
  if (purpose === "prefetch") return true;
  return false;
}

function attributionBurstKey(request, pathname) {
  const id = getTrustedClientId(request) ?? "";
  const q = request.nextUrl.search || "";
  return `${id}|${pathname}|${q}`;
}

/** @returns {boolean} false when this invocation should skip attribution (burst). */
export function tryConsumeAttributionBurst(request, pathname, nowMs) {
  const key = attributionBurstKey(request, pathname);
  const prev = attributionBurstSeen.get(key);
  if (prev != null && nowMs - prev < ATTRIBUTION_BURST_WINDOW_MS) return false;
  attributionBurstSeen.set(key, nowMs);

  if (attributionBurstSeen.size > 2000) {
    const cutoff = nowMs - ATTRIBUTION_BURST_WINDOW_MS * 3;
    for (const [k, t] of attributionBurstSeen) {
      if (t < cutoff) attributionBurstSeen.delete(k);
    }
  }
  return true;
}

/** @internal */
export function __resetAttributionBurstForTests() {
  attributionBurstSeen.clear();
}
