import {
  listCampaigns,
  listCampaignCouponChoices,
  listCampaignTierChoices,
  listCampaignTenantChoices,
} from "@/app/actions/admin/campaigns";
import { CampaignsAdminView } from "@/components/admin/views/CampaignsAdminView";
import { CommandCenterDataPolling } from "@/components/command-center/CommandCenterDataPolling";

export const metadata = {
  title: "Campaigns · Command Center",
  robots: { index: false, follow: false },
};

export default async function CampaignsPage() {
  const [campaigns, couponChoices, tierChoices, tenantChoices] =
    await Promise.all([
      listCampaigns(),
      listCampaignCouponChoices(),
      listCampaignTierChoices(),
      listCampaignTenantChoices(),
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
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Schedule promotional campaigns with linked coupons, banners, and
            optional per-tier price overrides. One active campaign per tenant.
          </p>
        </div>
      </div>
      <CampaignsAdminView
        campaigns={campaigns}
        couponChoices={couponChoices}
        tierChoices={tierChoices}
        tenantChoices={tenantChoices}
      />
    </div>
  );
}
