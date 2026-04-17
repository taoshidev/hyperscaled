import { Suspense } from "react"
import { Dashboard } from "@/components/dashboard/dashboard"
import { buildMetadata } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export const metadata = buildMetadata({
  title: "Trading Dashboard",
  description:
    "Monitor your challenge progress, open positions, and payout history in real time.",
  ogTitle: "Jolly Green Investor Dashboard",
  ogDescription:
    "Track your scaled account performance, open positions, and USDC payouts in real time.",
  path: "/jollygreen/dashboard",
  brand: "jollygreen",
})

export default function JollyGreenDashboardPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-[100dvh]" />}>
      <Dashboard />
    </Suspense>
  )
}
