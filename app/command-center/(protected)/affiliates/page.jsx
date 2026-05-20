import {
  listAdminAffiliatesPage,
  listAffiliateMinerChoices,
  listAffiliateParentChoices,
} from "@/app/actions/affiliates";
import { parseAffiliateAdminTab } from "@/lib/admin/affiliates-command-center-url";
import { getDb } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { asc, sql } from "drizzle-orm";
import { AffiliatesAdminView } from "@/components/admin/views/AffiliatesAdminView";

export const metadata = {
  title: "Affiliates · Command Center",
  robots: { index: false, follow: false },
};

async function listActivePromoCodes() {
  // Lightweight: codes that are still redeemable (not expired). Used only
  // as a datalist in the share-link generator so the limit is generous but
  // not unbounded.
  const db = await getDb();
  const rows = await db
    .select({ code: coupons.code })
    .from(coupons)
    .where(
      sql`${coupons.validUntil} IS NULL OR ${coupons.validUntil} > now()`,
    )
    .orderBy(asc(coupons.code))
    .limit(200);
  return rows.map((r) => r.code);
}

export default async function AffiliatesPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page ?? "1", 10) || 1);
  const tab = parseAffiliateAdminTab(typeof sp?.tab === "string" ? sp.tab : undefined);
  const q = typeof sp?.q === "string" ? sp.q : undefined;
  const sort = typeof sp?.sort === "string" ? sp.sort : undefined;
  const dir = typeof sp?.dir === "string" ? sp.dir : undefined;

  const [result, parentChoices, minerChoices, promoCodes] = await Promise.all([
    listAdminAffiliatesPage({ tab, q, page, sort, dir }),
    listAffiliateParentChoices(),
    listAffiliateMinerChoices(),
    listActivePromoCodes(),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-6 flex shrink-0 flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
            Partners
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Affiliates
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage partner companies and their sub-affiliates. Each row maps to
            a <span className="font-mono">?affiliate=</span> slug used in
            attribution URLs; rows tied to an entity miner are recognized as
            tenants in <span className="font-mono">?tenant=</span>.
          </p>
        </div>
      </div>
      <AffiliatesAdminView
        result={result}
        parentChoices={parentChoices}
        minerChoices={minerChoices}
        promoCodes={promoCodes}
      />
    </div>
  );
}
