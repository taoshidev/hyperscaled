import { RegistrationFlow } from "@/components/registration/registration-flow"
import { buildMetadata } from "@/lib/metadata"
import { getMinerBySlug, getTiersForMiner } from "@/lib/miners"
import { TIERS as TIER_META } from "@/lib/constants"
import { unstable_cache } from "next/cache"
import { listPriceUsdcFromDbTier } from "@/lib/wsb-tier-list-price"
import {
  resolveActiveCampaign,
  serializeActiveCampaign,
  applyCampaignToTierPrice,
} from "@/lib/campaign-pricing"

export const metadata = buildMetadata({
  title: "Start Your Challenge",
  description: "Choose your simulated scaled account size and begin your one-step Challenge on Hyperliquid. No recurring fees. Earn performance-based rewards.",
  ogTitle: "Start Your Challenge — Hyperstack Scaled Trading",
  ogDescription: "Choose from $5K to $100K. One-time USDC fee. Pass the Challenge. Earn USDC rewards in a simulated scaled account.",
  path: "/bitcast/register",
  brand: "bitcast",
})

export const dynamic = "force-dynamic"

const MINER_SLUG = "bitcast"

function enrichTier(dbTier, index) {
  const meta = TIER_META.find((t) => t.accountSize === dbTier.accountSize)
  return {
    id: meta?.id || `tier-${index}`,
    name: meta?.name || `$${dbTier.accountSize / 1000}K`,
    accountSize: dbTier.accountSize,
    fullPrice: meta?.fullPrice ?? null,
    promoPrice: listPriceUsdcFromDbTier(
      MINER_SLUG,
      dbTier.accountSize,
      Number(dbTier.priceUsdc),
    ),
    badge: meta?.badge ?? null,
    details: meta?.details ?? [],
  }
}

/**
 * Layer the active promotional campaign onto cached tiers. `promoPrice` stays
 * the standard list price (the checkout base the server discounts via coupon);
 * we add a display-only `salePrice` so the tier cards can show the discounted
 * price with the list price struck through — matching the marketing storefront.
 */
function applyCampaignToTiers(tiers, activeCampaign) {
  if (!Array.isArray(tiers)) return tiers
  return tiers.map((t) => {
    const list = Number(t.promoPrice)
    const { currentPrice } = applyCampaignToTierPrice(
      t.accountSize,
      list,
      activeCampaign,
    )
    return { ...t, salePrice: currentPrice }
  })
}

const getCachedRegisterMinerData = unstable_cache(
  async () => {
    const miner = await getMinerBySlug(MINER_SLUG)
    if (!miner) return { initialMinerTiers: null, initialPaymentWallet: null }
    const dbTiers = await getTiersForMiner(miner.hotkey)
    const activeTiers = dbTiers.filter((t) => t.isActive)
    return {
      initialMinerTiers: activeTiers.map(enrichTier),
      initialPaymentWallet: miner.usdcWallet,
    }
  },
  ["bitcast-register-miner-bitcast"],
  { revalidate: 60, tags: ["pricing-tiers", "pricing-tiers:bitcast"] },
)

export default async function BitcastRegisterPage() {
  let initialMinerTiers = null
  let initialPaymentWallet = null
  try {
    const data = await getCachedRegisterMinerData()
    initialMinerTiers = data.initialMinerTiers
    initialPaymentWallet = data.initialPaymentWallet
  } catch {
    // Keep nulls so client fallback fetch can recover.
  }

  const activeCampaign = await resolveActiveCampaign({
    minerSlug: MINER_SLUG,
  }).catch(() => null)

  const tiersForFlow = applyCampaignToTiers(initialMinerTiers, activeCampaign)

  return (
    <RegistrationFlow
      initialMinerSlug={MINER_SLUG}
      initialMinerTiers={tiersForFlow}
      initialPaymentWallet={initialPaymentWallet}
      logo="/hyperstack-logo.svg"
      logoAlt="Hyperstack"
      logoHref="https://hyperstack.trade"
      brandVariant="bitcast"
      activeCampaign={serializeActiveCampaign(activeCampaign)}
    />
  )
}
