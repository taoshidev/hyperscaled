import { NextResponse } from "next/server";

import { toCsv } from "@/lib/admin/csv.js";
import { parseAffiliateAdminTab } from "@/lib/admin/affiliates-command-center-url.js";
import { requireCommandCenterStaffForRoute } from "@/lib/auth/command-center.js";
import { fetchAffiliatesForAdminCsvExport } from "@/app/actions/affiliates.js";

const MAX_ROWS = 10_000;

export async function GET(request) {
  const auth = await requireCommandCenterStaffForRoute();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sp = request.nextUrl.searchParams;
  const tab = parseAffiliateAdminTab(sp.get("tab") ?? undefined);
  const q = sp.get("q") ?? undefined;
  const format = (sp.get("format") ?? "csv").toLowerCase().trim();
  const origin = request.nextUrl.origin;

  const rows = await fetchAffiliatesForAdminCsvExport(tab, q, MAX_ROWS);
  const date = new Date().toISOString().slice(0, 10);

  const withLinks = rows.map((r) => {
    const u = new URL("/", origin);
    u.searchParams.set("affiliate", r.slug);
    if (r.tenantSlug) u.searchParams.set("tenant", r.tenantSlug);
    if (r.promoCode) u.searchParams.set("promo", r.promoCode);
    return {
      slug: r.slug,
      name: r.name,
      parent_slug: r.parentSlug,
      tenant_slug: r.tenantSlug,
      promo_code: r.promoCode,
      affiliate_link: u.toString(),
      clicks: r.clicks,
      status: r.status,
      created_at: r.createdAt.toISOString(),
    };
  });

  if (format === "json") {
    return new Response(JSON.stringify(withLinks, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="affiliates-${tab}-${date}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const header = [
    "slug",
    "name",
    "parent_slug",
    "tenant_slug",
    "promo_code",
    "affiliate_link",
    "clicks",
    "status",
    "created_at",
  ];

  const body = toCsv(
    header,
    withLinks.map((r) => [
      r.slug,
      r.name,
      r.parent_slug,
      r.tenant_slug,
      r.promo_code,
      r.affiliate_link,
      String(r.clicks),
      r.status,
      r.created_at,
    ]),
  );

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="affiliates-${tab}-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
