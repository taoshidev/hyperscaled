import { cookies } from "next/headers"
import App from "@/components/marketing"
import { fetchDbPricingTiers } from "@/lib/pricing-db"
import { pricingMinerSlugForBrandId } from "@/lib/pricing-miner-slug"
import { buildMetadata } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export const metadata = buildMetadata({
  title: "Beanstock — Funded Trading on Hyperliquid",
  description:
    "Trade on Hyperliquid. Get a funded account. Keep 100% of your profits. 1-step challenge. Monthly USDC payouts. Scale to $400K.",
  ogTitle: "Beanstock — Funded Trading on Hyperliquid",
  ogDescription:
    "The most advanced decentralized prop trading infrastructure. 1-step challenge, 100% profit split, onchain USDC payouts.",
  path: "/beanstock",
  brand: "beanstock",
})

export default async function BeanstockHomePage() {
  const cookieStore = await cookies()
  const entry = cookieStore.get("hs_entry")?.value
  const lockedMiner = entry && entry !== "home" ? entry : null
  const tiers = await fetchDbPricingTiers(pricingMinerSlugForBrandId("beanstock"))
  return <App lockedMiner={lockedMiner} tiers={tiers} />
}
