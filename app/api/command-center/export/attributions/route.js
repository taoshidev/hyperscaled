import { NextResponse } from "next/server";

import { toCsv } from "@/lib/admin/csv.js";
import { parseAttributionFilters } from "@/lib/admin/attributions-command-center-url.js";
import { requireCommandCenterStaffForRoute } from "@/lib/auth/command-center.js";
import { listAttributionRowsForExport } from "@/app/actions/attributions.js";

export async function GET(request) {
  const auth = await requireCommandCenterStaffForRoute();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sp = request.nextUrl.searchParams;
  const filters = parseAttributionFilters({
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    affiliate: sp.get("affiliate") ?? undefined,
    tenant: sp.get("tenant") ?? undefined,
    promo: sp.get("promo") ?? undefined,
  });
  const format = (sp.get("format") ?? "csv").toLowerCase().trim();

  const rows = await listAttributionRowsForExport(filters);
  const date = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return new Response(JSON.stringify(rows, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="attributions-${date}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const header = [
    "registered_at",
    "registration_id",
    "affiliate_slug",
    "affiliate_name",
    "tenant_slug",
    "tenant_name",
    "promo_code",
    "user_wallet",
    "user_email",
    "hl_address",
    "account_size",
    "amount_usdc",
  ];

  const body = toCsv(
    header,
    rows.map((r) => [
      r.registeredAt instanceof Date
        ? r.registeredAt.toISOString()
        : String(r.registeredAt ?? ""),
      String(r.registrationId ?? ""),
      r.affiliateSlug ?? "",
      r.affiliateName ?? "",
      r.entityMinerSlug ?? "",
      r.entityMinerName ?? "",
      r.promoCode ?? "",
      r.userWallet ?? "",
      r.userEmail ?? "",
      r.hlAddress ?? "",
      r.accountSize != null ? String(r.accountSize) : "",
      r.amountUsdc != null ? String(r.amountUsdc) : "",
    ]),
  );

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attributions-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
