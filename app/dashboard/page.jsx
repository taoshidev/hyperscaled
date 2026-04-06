import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { buildMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Trading Dashboard",
  description:
    "Monitor your Hyperscaled challenge progress, open positions, and payout history in real time.",
  ogTitle: "Hyperscaled Trading Dashboard",
  ogDescription:
    "Track your funded account performance, open positions, and USDC payouts in real time.",
  path: "/dashboard",
});

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="bg-[#09090b] min-h-[100dvh]" />}>
      <Dashboard />
    </Suspense>
  );
}
