/**
 * Coverage for the last-touch attribution behavior implemented in
 * `proxy.js::applyAttributionCookieIfNeeded`.
 *
 * Before the change, the proxy was first-touch: once `hs_attr` was set,
 * subsequent visits with `?affiliate=`, `?tenant=`, or `?promo=` query
 * params were silently ignored. The Conversion Ledger then recorded the
 * earliest partner click for the user instead of the partner who actually
 * drove the conversion.
 *
 * After the change:
 *   - Bare visits (no explicit signal) → preserve any existing cookie.
 *   - Visits with explicit `?affiliate` / `?tenant` / `?promo` → mint a
 *     fresh cookie, overwriting whatever was there. Each refresh also
 *     fires a new `referral_clicks` row via `/api/track/click`.
 *
 * The proxy uses `NextRequest` / `NextResponse` for cookie I/O, both of
 * which work in plain Node (they wrap WHATWG Request/Response). We exercise
 * `proxy()` directly with constructed `NextRequest`s and inspect the
 * Set-Cookie header on the returned response.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  ATTRIBUTION_COOKIE,
  signAttributionCookie,
} from "@/lib/auth/attribution-cookie";
import { __resetAttributionBurstForTests } from "@/lib/marketing-attribution-request.js";
import { proxy } from "@/proxy";

const TEST_SECRET = "abcdef0123456789abcdef0123456789-test-secret";

/**
 * Pull the value of the `hs_attr` Set-Cookie header off a NextResponse.
 * Returns the cookie value (the bit before the first `;`) or `undefined`
 * if the response did not set one.
 */
function readSetAttr(response) {
  const header = response.headers.get("set-cookie");
  if (!header) return undefined;
  // Multiple cookies may share one Set-Cookie header on a response when
  // the proxy also sets `hs_entry` / `hs_affiliate`. Split on the
  // standard ", <name>=" boundary that NextResponse uses.
  const parts = header.split(/,(?=\s*[A-Za-z_][\w-]*=)/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${ATTRIBUTION_COOKIE}=`)) {
      const eq = trimmed.indexOf("=");
      const semi = trimmed.indexOf(";");
      return trimmed.slice(eq + 1, semi === -1 ? undefined : semi);
    }
  }
  return undefined;
}

beforeEach(() => {
  process.env.ATTRIBUTION_COOKIE_SECRET = TEST_SECRET;
  __resetAttributionBurstForTests();
  // /api/track/click is called fire-and-forget; stub the global fetch so
  // tests don't reach the loopback (and don't hang waiting for a server).
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(null, { status: 204 }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("proxy() — attribution cookie (last-touch)", () => {
  it("does NOT mint a cookie on a bare visit (no existing cookie, no explicit signal)", async () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = await proxy(req);
    expect(readSetAttr(res)).toBeUndefined();
  });

  it("does NOT overwrite or expire the cookie on a bare visit when one already exists", async () => {
    const existing = await signAttributionCookie({
      affiliate: "lunarcrush",
      tenant: "vanta",
      promo: "EXISTING-CODE",
      clickId: "11111111-1111-4111-8111-111111111111",
      firstTouchAt: 1716068400,
    });

    const req = new NextRequest("http://localhost:3000/pricing");
    req.cookies.set(ATTRIBUTION_COOKIE, existing);

    const res = await proxy(req);
    // No explicit signal → no Set-Cookie touching `hs_attr`.
    expect(readSetAttr(res)).toBeUndefined();
  });

  it("mints a fresh cookie on the first visit that carries an explicit ?affiliate", async () => {
    const req = new NextRequest(
      "http://localhost:3000/?affiliate=lucas-aff&tenant=vanta&promo=HS-55Z3-CA9V",
    );
    const res = await proxy(req);

    const newCookie = readSetAttr(res);
    expect(newCookie, "expected proxy to Set-Cookie hs_attr").toBeDefined();
    expect(newCookie?.length).toBeGreaterThan(0);
  });

  it("OVERWRITES the existing cookie when a later visit carries explicit signals (last-touch)", async () => {
    // Visit #1: affiliate=lunarcrush (e.g. an older test session).
    const firstCookie = await signAttributionCookie({
      affiliate: "lunarcrush",
      tenant: "lunarcrush",
      promo: "OLD-PROMO",
      clickId: "22222222-2222-4222-8222-222222222222",
      firstTouchAt: 1716000000,
    });

    // Visit #2: same browser, but URL now points at a different partner.
    const req = new NextRequest(
      "http://localhost:3000/?affiliate=lucas-aff&tenant=vanta&promo=HS-55Z3-CA9V",
    );
    req.cookies.set(ATTRIBUTION_COOKIE, firstCookie);

    const res = await proxy(req);

    const overwritten = readSetAttr(res);
    expect(
      overwritten,
      "regression: the proxy must overwrite hs_attr on a new explicit visit",
    ).toBeDefined();
    expect(overwritten).not.toBe(firstCookie);
  });

  it("treats `?promo=` alone as an explicit signal sufficient to refresh the cookie", async () => {
    // No affiliate, no tenant — but a promo code in the URL still counts
    // as an explicit attribution intent and must refresh the cookie.
    const existing = await signAttributionCookie({
      affiliate: "lunarcrush",
      tenant: "lunarcrush",
      promo: "OLD-PROMO",
      clickId: "33333333-3333-4333-8333-333333333333",
      firstTouchAt: 1716000000,
    });
    const req = new NextRequest("http://localhost:3000/?promo=NEW-PROMO");
    req.cookies.set(ATTRIBUTION_COOKIE, existing);

    const res = await proxy(req);
    const refreshed = readSetAttr(res);
    expect(refreshed).toBeDefined();
    expect(refreshed).not.toBe(existing);
  });

  it("fires a /api/track/click record once per refresh (every explicit visit appears in the click stream)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T00:00:00.000Z"));

    const firstReq = new NextRequest("http://localhost:3000/?affiliate=A");
    await proxy(firstReq);

    vi.setSystemTime(new Date("2026-05-01T00:00:01.000Z"));

    const secondReq = new NextRequest("http://localhost:3000/?affiliate=A");
    secondReq.cookies.set(
      ATTRIBUTION_COOKIE,
      await signAttributionCookie({
        affiliate: "A",
        tenant: null,
        promo: null,
        clickId: "44444444-4444-4444-8444-444444444444",
        firstTouchAt: 1716000000,
      }),
    );
    await proxy(secondReq);

    vi.useRealTimers();

    await new Promise((r) => setTimeout(r, 0));

    const clickPosts = globalThis.fetch.mock.calls.filter((args) => {
      const [url, init] = args;
      const u = String(url);
      return u.includes("/api/track/click") && init?.method === "POST";
    });
    expect(clickPosts.length).toBe(2);
  });

  it("does not mint clicks on Next prefetch / RSC-style replay of the landing URL", async () => {
    const req = new NextRequest(
      "http://localhost:3000/?affiliate=tester&tenant=vanta",
    );
    req.headers.set("Next-Router-Prefetch", "1");
    const res = await proxy(req);
    expect(readSetAttr(res)).toBeUndefined();
    await new Promise((r) => setTimeout(r, 0));
    const clickPosts = globalThis.fetch.mock.calls.filter((args) => {
      const [url, init] = args;
      return String(url).includes("/api/track/click") && init?.method === "POST";
    });
    expect(clickPosts.length).toBe(0);
  });

  it("dedupes near-simultaneous proxy executions for identical landing URLs", async () => {
    const url =
      "http://localhost:3000/?affiliate=beanstock&tenant=beanstock&promo=HS-V75A-8S6U";
    await proxy(new NextRequest(url));
    await proxy(new NextRequest(url));
    await new Promise((r) => setTimeout(r, 0));

    const clickPosts = globalThis.fetch.mock.calls.filter((args) => {
      const [u, init] = args;
      return String(u).includes("/api/track/click") && init?.method === "POST";
    });
    expect(clickPosts.length).toBe(1);
  });
});
