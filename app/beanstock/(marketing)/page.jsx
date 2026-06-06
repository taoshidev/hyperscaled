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
  title: "Beanstock — Scaled Trading on Hyperliquid",
  description:
    "Trade on Hyperliquid. Get a simulated scaled account. Earn performance-based rewards. 1-step challenge. Monthly USDC payouts. Scale to $400K.",
  ogTitle: "Beanstock — Scaled Trading on Hyperliquid",
  ogDescription:
    "The most advanced decentralized prop trading infrastructure. 1-step challenge, USDC rewards, onchain USDC payouts.",
  path: "/beanstock",
  brand: "beanstock",
})

export default async function BeanstockHomePage() {
  const cookieStore = await cookies()
  const entry = cookieStore.get("hs_entry")?.value
  const lockedMiner = entry && entry !== "home" ? entry : null
  const minerSlug = pricingMinerSlugForBrandId("beanstock")
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
