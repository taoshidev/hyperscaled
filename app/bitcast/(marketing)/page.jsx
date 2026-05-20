import { cookies } from "next/headers"
import App from "@/components/marketing"
import { PRICING_TIERS } from "@/lib/constants"
import { buildMetadata } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export const metadata = buildMetadata({
  title: "HyperFunded — Scaled Perp Trading on Hyperliquid",
  description: "Trade perps on Hyperliquid. Get a scaled account. Keep 100% of eligible rewards. One-step challenge, USDC payouts, and scale up to $400K.",
  ogTitle: "HyperFunded — Scaled Perp Trading on Hyperliquid",
  ogDescription: "Trade perps on Hyperliquid with scaled capital. One-step challenge, 100% profit split, onchain USDC rewards, scale to $400K.",
  path: "/bitcast",
  brand: "bitcast",
})

export default async function BitcastHomePage() {
  const cookieStore = await cookies()
  const entry = cookieStore.get("hs_entry")?.value
  const lockedMiner = entry && entry !== "home" ? entry : null
  return <App lockedMiner={lockedMiner} tiers={PRICING_TIERS} />
}
