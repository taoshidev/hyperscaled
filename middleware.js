import { NextResponse } from "next/server";

const VANTA_HOSTNAMES = new Set(["hs.vantatrading.io"]);
const BEANSTOCK_HOSTNAMES = new Set(["www.beanstocktrading.com", "beanstocktrading.com"]);
const INTERNAL_PATH_PREFIXES = ["/_next", "/api", "/monitoring"];
const AFFILIATE_SLUG_ROUTES = new Set(["strato"]);

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
    const utm = searchParams.get("aff");
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

export function middleware(request) {
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

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|monitoring|.*\\..*).*)"],
};
