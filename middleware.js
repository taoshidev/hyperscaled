import { NextResponse } from "next/server";

const VANTA_HOSTNAMES = new Set(["hs.vantatrading.io"]);
const INTERNAL_PATH_PREFIXES = ["/_next", "/api", "/monitoring"];

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

function applyTrackingCookies(response, { entryCookie, affiliateCookie, minerMatch, pathname, searchParams }) {
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
}

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const hostname = getHostname(request);
  const entryCookie = request.cookies.get("hs_entry")?.value;
  const affiliateCookie = request.cookies.get("hs_affiliate")?.value;
  const minerMatch = pathname.match(/^\/miner\/([^/]+)/);

  if (entryCookie && entryCookie !== "home" && minerMatch) {
    const slug = minerMatch[1];
    if (slug !== entryCookie) {
      const url = request.nextUrl.clone();
      url.pathname = `/miner/${entryCookie}`;
      return NextResponse.redirect(url);
    }
  }

  let response;

  if (shouldRewriteToVanta(hostname, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/vanta${pathname}`;
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
  }

  applyTrackingCookies(response, {
    entryCookie,
    affiliateCookie,
    minerMatch,
    pathname,
    searchParams,
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|monitoring|.*\\..*).*)"],
};
