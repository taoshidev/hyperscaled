import {
  listAdminCouponsPage,
  listCouponAdminTierChoices,
} from "@/app/actions/coupons";
import { parseCouponAdminTab } from "@/lib/admin/coupons-command-center-url";
import { CouponsAdminView } from "@/components/admin/views/CouponsAdminView";
import { CouponCreateButtonModal } from "@/components/admin/views/CouponCreateButtonModal";
import { CommandCenterDataPolling } from "@/components/command-center/CommandCenterDataPolling";

export const metadata = {
  title: "Promotional codes · Command Center",
  robots: { index: false, follow: false },
};

export default async function PromoCodesPage({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page ?? "1", 10) || 1);
  const tab = parseCouponAdminTab(typeof sp?.tab === "string" ? sp.tab : undefined);
  const sort = typeof sp?.sort === "string" ? sp.sort : undefined;
  const dir = typeof sp?.dir === "string" ? sp.dir : undefined;

  const [result, tierChoices] = await Promise.all([
    listAdminCouponsPage({ tab, page, sort, dir }),
    listCouponAdminTierChoices(),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CommandCenterDataPolling />
      <div className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
              Promotions
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Promotional codes
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create, list, and manage promotional codes used at registration.
          </p>
        </div>
        <div className="shrink-0">
          <CouponCreateButtonModal tierChoices={tierChoices} />
        </div>
      </div>
      <CouponsAdminView result={result} />
    </div>
  );
}
