import { cookies } from "next/headers"
import App from "@/components/marketing"
import { fetchDbPricingTiers } from "@/lib/pricing-db"
import { buildMetadata } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export const metadata = buildMetadata({
  title: "Vanta Trading — Scaled Trading on Hyperliquid",
  description:
    "Trade on Hyperliquid. Get a scaled account. Keep 100% of your profits. 1-step challenge. Monthly USDC payouts. Scale to $2.5M.",
  ogTitle: "Vanta Trading — Scaled Trading on Hyperliquid",
  ogDescription:
    "The most advanced decentralized prop trading infrastructure. 1-step challenge, 100% profit split, onchain USDC payouts.",
  path: "/vanta",
  brand: "vanta",
})

export default async function VantaHomePage() {
  const cookieStore = await cookies()
  const entry = cookieStore.get("hs_entry")?.value
  const lockedMiner = entry && entry !== "home" ? entry : null
  const tiers = await fetchDbPricingTiers('vanta')
  return <App lockedMiner={lockedMiner} tiers={tiers} />
}
