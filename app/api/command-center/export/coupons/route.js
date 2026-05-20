import { NextResponse } from "next/server";

import { toCsv } from "@/lib/admin/csv.js";
import { parseCouponAdminTab } from "@/lib/admin/coupons-command-center-url.js";
import { requireCommandCenterStaffForRoute } from "@/lib/auth/command-center.js";
import { fetchCouponsForAdminCsvExport } from "@/app/actions/coupons.js";

const MAX_ROWS = 10_000;

export async function GET(request) {
  const auth = await requireCommandCenterStaffForRoute();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const tabParam = request.nextUrl.searchParams.get("tab") ?? undefined;
  const tab = parseCouponAdminTab(tabParam);
  const format = (request.nextUrl.searchParams.get("format") ?? "csv")
    .toLowerCase()
    .trim();

  const rows = await fetchCouponsForAdminCsvExport(tab, MAX_ROWS);
  const date = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return new Response(JSON.stringify(rows, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="coupons-${tab}-${date}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const header = [
    "code",
    "discount_type",
    "discount_value",
    "use_type",
    "max_uses",
    "allowed_emails_csv",
    "allowed_tier_ids_csv",
    "redemption_count",
    "valid_from",
    "valid_until",
    "created_at",
    "created_by_wallet",
    "user_wallets",
    "user_emails",
    "redeemed_at_list",
    "payment_intent_ids",
  ];

  const body = toCsv(
    header,
    rows.map((r) => [
      r.code,
      r.discountType,
      r.discountValue,
      r.useType,
      r.maxUses != null ? String(r.maxUses) : "",
      (r.allowedEmails ?? []).join(";"),
      (r.allowedTierIds ?? []).join(";"),
      String(r.redemptionCount),
      r.validFrom?.toISOString() ?? "",
      r.validUntil?.toISOString() ?? "",
      r.createdAt.toISOString(),
      r.createdByWallet ?? "",
      r.redemptions.map((x) => x.userWallet ?? "").join(";"),
      r.redemptions.map((x) => x.userEmail ?? "").join(";"),
      r.redemptions.map((x) => x.redeemedAt.toISOString()).join(";"),
      r.redemptions.map((x) => x.paymentIntentId ?? "").join(";"),
    ]),
  );

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="coupons-${tab}-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
