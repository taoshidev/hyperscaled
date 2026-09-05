import {
  countPendingRegistrations,
  listAdminRegistrationsPage,
} from "@/app/actions/registrations";
import { parseRegistrationsAdminStatus } from "@/lib/admin/registrations-command-center";
import { RegistrationsAdminView } from "@/components/admin/views/RegistrationsAdminView";
import { RetryAllPendingButton } from "@/components/admin/views/RegistrationRetryControls";
import { CommandCenterDataPolling } from "@/components/command-center/CommandCenterDataPolling";

export const metadata = {
  title: "Registrations · Command Center",
  robots: { index: false, follow: false },
};

// The Retry server action runs under this segment: give it the same budget
// as the cron route (the retry loop stops itself at RETRY_BUDGET_MS, 55s).
export const maxDuration = 60;

export default async function RegistrationsPage({ searchParams }) {
  const sp = await searchParams;
  const parsedPage = parseInt(sp?.page ?? "1", 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const status = parseRegistrationsAdminStatus(typeof sp?.status === "string" ? sp.status : undefined);

  const [result, pendingCount] = await Promise.all([
    listAdminRegistrationsPage({ page, status }),
    countPendingRegistrations(),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CommandCenterDataPolling />
      <div className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-400">
              Onboarding
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Registrations</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Paid registrations the miner has not provisioned yet. Retry re-sends
            <span className="font-mono"> create-hl-subaccount</span> for pending rows; a cron does the same every 15 minutes.
          </p>
        </div>
        <div className="shrink-0">
          <RetryAllPendingButton pendingCount={pendingCount} />
        </div>
      </div>
      <RegistrationsAdminView result={result} />
    </div>
  );
}
