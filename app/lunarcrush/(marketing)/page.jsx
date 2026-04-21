import { cookies } from "next/headers"
import App from "@/components/marketing"
import { PRICING_TIERS } from "@/lib/constants"
import { buildMetadata } from "@/lib/metadata"

export const dynamic = "force-dynamic"

export const metadata = buildMetadata({
  title: "LunarCrush Scaled — Social-Informed Scaled Trading on Hyperliquid",
  description:
    "Trade Hyperliquid with a scaled account and live LunarCrush social data. 1-step challenge, 100% profit split, monthly USDC payouts, scale to $2.5M.",
  ogTitle: "LunarCrush Scaled — Social-Informed Scaled Trading on Hyperliquid",
  ogDescription:
    "Trade Hyperliquid with a scaled account and live LunarCrush social data. 1-step challenge, 100% profit split, monthly USDC payouts, scale to $2.5M.",
  path: "/lunarcrush",
  brand: "lunarcrush",
})

export default async function LunarCrushHomePage() {
  const cookieStore = await cookies()
  const entry = cookieStore.get("hs_entry")?.value
  const lockedMiner = entry && entry !== "home" ? entry : null
  return <App lockedMiner={lockedMiner} tiers={PRICING_TIERS} />
}
