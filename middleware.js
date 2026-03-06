import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const entryCookie = request.cookies.get("hs_entry")?.value;
  const affiliateCookie = request.cookies.get("hs_affiliate")?.value;
  const minerMatch = pathname.match(/^\/miner\/([^/]+)/);

  // Check for redirect first
  if (entryCookie && entryCookie !== "home" && minerMatch) {
    const slug = minerMatch[1];
    if (slug !== entryCookie) {
      const url = request.nextUrl.clone();
      url.pathname = `/miner/${entryCookie}`;
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();

  // Set hs_entry cookie if not present
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

  // Capture UTM param into hs_affiliate cookie
  if (!affiliateCookie) {
    const utm = searchParams.get("utm");
    if (utm) {
      response.cookies.set("hs_affiliate", utm, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/miner/:path*"],
};
