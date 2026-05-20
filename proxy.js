import { NextResponse } from "next/server";
import {
  ATTRIBUTION_COOKIE,
  attributionCookieOptions,
  signAttributionCookie,
} from "@/lib/auth/attribution-cookie";
import {
  isAuxiliaryMarketingRequest,
  tryConsumeAttributionBurst,
} from "@/lib/marketing-attribution-request.js";

const VANTA_HOSTNAMES = new Set(["hs.vantatrading.io"]);
const BEANSTOCK_HOSTNAMES = new Set(["www.beanstocktrading.com", "beanstocktrading.com"]);
const INTERNAL_PATH_PREFIXES = ["/_next", "/api", "/monitoring", "/command-center"];
const AFFILIATE_SLUG_ROUTES = new Set(["strato"]);

const IMPLICIT_TENANT_BY_HOSTNAME = {
  "hs.vantatrading.io": "vanta",
  "www.beanstocktrading.com": "beanstock",
  "beanstocktrading.com": "beanstock",
};
const IMPLICIT_TENANT_BY_PATH_PREFIX = {
  "/vanta": "vanta",
  "/beanstock": "beanstock",
  "/lunarcrush": "lunarcrush",
  "/wsb": "wsb",
  "/wallstreetbets": "wsb",
  "/bitcast": "bitcast",
};

function getHostname(request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || "";
  return host.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
}

function shouldRewriteToVanta(hostname, pathname) {
  if (!VANTA_HOSTNAMES.has(hostname)) {
    return false;
  }

  if (pathname === "/vanta" || pathname.startsWith("/vanta/")) {
    return false;
  }

  return !INTERNAL_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function shouldRewriteToBeanstock(hostname, pathname) {
  if (!BEANSTOCK_HOSTNAMES.has(hostname)) {
    return false;
  }

  if (pathname === "/beanstock" || pathname.startsWith("/beanstock/")) {
    return false;
  }

  return !INTERNAL_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getNormalizedVantaPath(pathname) {
  if (pathname === "/vanta") {
    return "/";
  }

  if (pathname.startsWith("/vanta/")) {
    return pathname.replace(/^\/vanta/, "") || "/";
  }

  return null;
}

function getNormalizedBeanstockPath(pathname) {
  if (pathname === "/beanstock") {
    return "/";
  }

  if (pathname.startsWith("/beanstock/")) {
    return pathname.replace(/^\/beanstock/, "") || "/";
  }

  return null;
}

function applyTrackingCookies(response, { entryCookie, affiliateCookie, toltRefCookie, minerMatch, pathname, searchParams }) {
  if (!entryCookie) {
    const entryValue = minerMatch ? minerMatch[1] : pathname === "/" ? "home" : null;
    if (entryValue) {
      response.cookies.set("hs_entry", entryValue, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }

  if (!affiliateCookie) {
    const utm = searchParams.get("aff") || searchParams.get("affiliate");
    if (utm) {
      response.cookies.set("hs_affiliate", utm, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }

  if (!toltRefCookie) {
    const ref = searchParams.get("ref");
    if (ref) {
      response.cookies.set("tolt_ref", ref, {
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
        sameSite: "lax",
      });
    }
  }
}

function pickImplicitTenant(hostname, pathname) {
  if (IMPLICIT_TENANT_BY_HOSTNAME[hostname]) {
    return IMPLICIT_TENANT_BY_HOSTNAME[hostname];
  }
  for (const [prefix, slug] of Object.entries(IMPLICIT_TENANT_BY_PATH_PREFIX)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return slug;
    }
  }
  return null;
}

function readAttributionInputs(request, hostname, pathname, searchParams) {
  const affiliate =
    searchParams.get("affiliate") || searchParams.get("aff") || null;
  const tenantParam = searchParams.get("tenant") || null;
  const promo = searchParams.get("promo") || null;
  const tenant = tenantParam || pickImplicitTenant(hostname, pathname);

  const hasExplicitSignal = Boolean(affiliate || tenantParam || promo);

  return { affiliate, tenant, promo, hasExplicitSignal };
}

function makeUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function fireAndForgetClickRecord(request, payload) {
  const url = new URL("/api/track/click", request.nextUrl.origin);
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

async function applyAttributionCookieIfNeeded(response, request, hostname, pathname, searchParams) {
  const { affiliate, tenant, promo, hasExplicitSignal } = readAttributionInputs(
    request,
    hostname,
    pathname,
    searchParams,
  );

  if (!hasExplicitSignal) return;

  if (isAuxiliaryMarketingRequest(request)) return;

  const nowMs = Date.now();
  if (!tryConsumeAttributionBurst(request, pathname, nowMs)) return;

  const clickId = makeUuid();
  const firstTouchAt = Math.floor(Date.now() / 1000);

  let cookieValue;
  try {
    cookieValue = await signAttributionCookie({
      affiliate,
      tenant,
      promo,
      clickId,
      firstTouchAt,
    });
  } catch {
    return;
  }

  response.cookies.set(ATTRIBUTION_COOKIE, cookieValue, attributionCookieOptions());

  fireAndForgetClickRecord(request, {
    clickId,
    affiliate,
    tenant,
    promo,
    landingPath: pathname,
    referrer: request.headers.get("referer") || null,
    userAgent: request.headers.get("user-agent") || null,
    occurredAt: firstTouchAt,
  });
}

export async function proxy(request) {
  const { pathname, searchParams } = request.nextUrl;
  const hostname = getHostname(request);
  const entryCookie = request.cookies.get("hs_entry")?.value;
  const affiliateCookie = request.cookies.get("hs_affiliate")?.value;
  const toltRefCookie = request.cookies.get("tolt_ref")?.value;
  const minerMatch = pathname.match(/^\/miner\/([^/]+)/);
  const normalizedVantaPath = getNormalizedVantaPath(pathname);
  const normalizedBeanstockPath = getNormalizedBeanstockPath(pathname);

  if (VANTA_HOSTNAMES.has(hostname) && normalizedVantaPath) {
    const url = request.nextUrl.clone();
    url.pathname = normalizedVantaPath;
    const response = NextResponse.redirect(url);
    applyTrackingCookies(response, {
      entryCookie,
      affiliateCookie,
      toltRefCookie,
      minerMatch,
      pathname: normalizedVantaPath,
      searchParams,
    });
    await applyAttributionCookieIfNeeded(
      response,
      request,
      hostname,
      normalizedVantaPath,
      searchParams,
    );
    return response;
  }

  if (BEANSTOCK_HOSTNAMES.has(hostname) && normalizedBeanstockPath) {
    const url = request.nextUrl.clone();
    url.pathname = normalizedBeanstockPath;
    const response = NextResponse.redirect(url);
    applyTrackingCookies(response, {
      entryCookie,
      affiliateCookie,
      toltRefCookie,
      minerMatch,
      pathname: normalizedBeanstockPath,
      searchParams,
    });
    await applyAttributionCookieIfNeeded(
      response,
      request,
      hostname,
      normalizedBeanstockPath,
      searchParams,
    );
    return response;
  }

  if (entryCookie && entryCookie !== "home" && minerMatch) {
    const slug = minerMatch[1];
    if (slug !== entryCookie) {
      const url = request.nextUrl.clone();
      url.pathname = `/miner/${entryCookie}`;
      return NextResponse.redirect(url);
    }
  }

  const affiliateSlugMatch = pathname.match(/^\/([^/]+)\/?$/);
  if (affiliateSlugMatch && AFFILIATE_SLUG_ROUTES.has(affiliateSlugMatch[1]) && !VANTA_HOSTNAMES.has(hostname) && !BEANSTOCK_HOSTNAMES.has(hostname)) {
    const slug = affiliateSlugMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const response = NextResponse.rewrite(url);
    response.cookies.set("hs_affiliate", slug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    if (!entryCookie) {
      response.cookies.set("hs_entry", "home", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }

    await applyAttributionCookieIfNeeded(
      response,
      request,
      hostname,
      pathname,
      new URLSearchParams({ affiliate: slug }),
    );
    return response;
  }

  let response;

  if (shouldRewriteToVanta(hostname, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/vanta${pathname}`;
    response = NextResponse.rewrite(url);
  } else if (shouldRewriteToBeanstock(hostname, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/beanstock${pathname}`;
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
  }

  applyTrackingCookies(response, {
    entryCookie,
    affiliateCookie,
    toltRefCookie,
    minerMatch,
    pathname,
    searchParams,
  });

  await applyAttributionCookieIfNeeded(
    response,
    request,
    hostname,
    pathname,
    searchParams,
  );

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|monitoring|command-center|.*\\..*).*)"],
};
