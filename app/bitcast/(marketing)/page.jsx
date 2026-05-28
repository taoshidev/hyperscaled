import { cookies } from "next/headers"
import App from "@/components/marketing"
import { fetchDbPricingTiers } from "@/lib/pricing-db"
import { pricingMinerSlugForBrandId } from "@/lib/pricing-miner-slug"
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
  const tiers = await fetchDbPricingTiers(pricingMinerSlugForBrandId("bitcast"))
  return <App lockedMiner={lockedMiner} tiers={tiers} />
}
