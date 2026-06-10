import { cookies } from "next/headers"
import App from "@/components/marketing"
import { fetchDbPricingTiers } from "@/lib/pricing-db"
import { pricingMinerSlugForBrandId } from "@/lib/pricing-miner-slug"
import {
  resolveActiveCampaign,
  serializeActiveCampaign,
} from "@/lib/campaign-pricing"
import { buildMetadata } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export const metadata = buildMetadata({
  title: "Hyperstack — Scaled Perp Trading on Hyperliquid",
  description: "Trade perps on Hyperliquid in a Vanta-powered simulated scaled account. USDC rewards, one-step Challenge, and scale up to $400K.",
  ogTitle: "Hyperstack — Scaled Perp Trading on Hyperliquid",
  ogDescription: "Trade perps on Hyperliquid in a Vanta-powered simulated scaled account. One-step Challenge, USDC rewards, scale to $400K.",
  path: "/bitcast",
  brand: "bitcast",
})

export default async function BitcastHomePage() {
  const cookieStore = await cookies()
  const entry = cookieStore.get("hs_entry")?.value
  const lockedMiner = entry && entry !== "home" ? entry : null
  const minerSlug = pricingMinerSlugForBrandId("bitcast")
  const activeCampaign = await resolveActiveCampaign({ minerSlug }).catch(
    () => null,
  )
  const tiers = await fetchDbPricingTiers(minerSlug, { activeCampaign })
  return (
    <App
      lockedMiner={lockedMiner}
      tiers={tiers}
      activeCampaign={serializeActiveCampaign(activeCampaign)}
    />
  )
}
