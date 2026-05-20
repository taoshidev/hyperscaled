import { listAdminAttributionsPage } from "@/app/actions/attributions";
import { parseAttributionFilters } from "@/lib/admin/attributions-command-center-url";
import { getDb } from "@/lib/db";
import { affiliates, entityMiners } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { AttributionsAdminView } from "@/components/admin/views/AttributionsAdminView";
import { CommandCenterDataPolling } from "@/components/command-center/CommandCenterDataPolling";
import { requireCommandCenterStaff } from "@/lib/auth/command-center";

export const metadata = {
  title: "Attribution · Command Center",
  robots: { index: false, follow: false },
};

async function listAffiliateSlugs() {
  const db = await getDb();
  const rows = await db
    .select({ slug: affiliates.slug })
    .from(affiliates)
    .where(eq(affiliates.isActive, true))
    .orderBy(asc(affiliates.slug))
    .limit(500);
  return rows.map((r) => r.slug);
}

async function listMinerSlugs() {
  const db = await getDb();
  const rows = await db
    .select({ slug: entityMiners.slug })
    .from(entityMiners)
    .orderBy(asc(entityMiners.slug));
  return rows.map((r) => r.slug);
}

export default async function AttributionsPage({ searchParams }) {
  await requireCommandCenterStaff();

  const sp = await searchParams;
  const filters = parseAttributionFilters(sp ?? {});

  const [result, affiliateSlugs, minerSlugs] = await Promise.all([
    listAdminAttributionsPage(filters),
    listAffiliateSlugs(),
    listMinerSlugs(),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CommandCenterDataPolling />
      <div className="mb-6 flex shrink-0 flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
            Reporting
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Attribution
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Clicks from landing URLs; signups and paid registrations follow our
            last-touch attribution rules. Export this view to settle commissions
            out-of-band.
          </p>
        </div>
      </div>
      <AttributionsAdminView
        result={result}
        affiliateSlugs={affiliateSlugs}
        minerSlugs={minerSlugs}
      />
    </div>
  );
}
