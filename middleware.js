import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const entryCookie = request.cookies.get("hs_entry")?.value;
  const minerMatch = pathname.match(/^\/miner\/([^/]+)/);

  if (!entryCookie) {
    if (pathname === "/") {
      const response = NextResponse.next();
      response.cookies.set("hs_entry", "home", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    }

    if (minerMatch) {
      const response = NextResponse.next();
      response.cookies.set("hs_entry", minerMatch[1], {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    }
  } else if (entryCookie !== "home" && minerMatch) {
    const slug = minerMatch[1];
    if (slug !== entryCookie) {
      const url = request.nextUrl.clone();
      url.pathname = `/miner/${entryCookie}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/miner/:path*"],
};
