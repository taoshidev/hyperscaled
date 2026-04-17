import { RegistrationFlow } from "@/components/registration/registration-flow"
import { buildMetadata } from "@/lib/metadata"
import { getMinerBySlug, getTiersForMiner } from "@/lib/miners"
import { TIERS as TIER_META } from "@/lib/constants"
import { unstable_cache } from "next/cache"

export const metadata = buildMetadata({
  title: "Start Your Challenge",
  description:
    "Choose your scaled account size and begin your one-step challenge on Hyperliquid. No recurring fees. 100% of performance rewards are yours.",
  ogTitle: "Start Your Challenge — Beanstock Scaled Trading",
  ogDescription:
    "Choose from $5K to $100K. One-time USDC fee. Pass the challenge. Keep 100% of your profits.",
  path: "/beanstock/register",
  brand: "beanstock",
})

export const dynamic = "force-dynamic"

const MINER_SLUG = "beanstock"

function enrichTier(dbTier, index) {
  const meta = TIER_META.find((t) => t.accountSize === dbTier.accountSize)
  return {
    id: meta?.id || `tier-${index}`,
    name: meta?.name || `$${dbTier.accountSize / 1000}K`,
    accountSize: dbTier.accountSize,
    fullPrice: meta?.fullPrice ?? null,
    promoPrice: Number(dbTier.priceUsdc),
    badge: meta?.badge ?? null,
    details: meta?.details ?? [],
  }
}

const getCachedRegisterMinerData = unstable_cache(
  async () => {
    const miner = await getMinerBySlug(MINER_SLUG)
    if (!miner) {
      return { initialMinerTiers: null, initialPaymentWallet: null }
    }

    const dbTiers = await getTiersForMiner(miner.hotkey)
    const activeTiers = dbTiers.filter((t) => t.isActive)

    return {
      initialMinerTiers: activeTiers.map(enrichTier),
      initialPaymentWallet: miner.usdcWallet,
    }
  },
  ["beanstock-register-miner-beanstock"],
  {
    revalidate: 60,
    tags: ["pricing-tiers", "pricing-tiers:beanstock"],
  },
)

export default async function BeanstockRegisterPage() {
  let initialMinerTiers = null
  let initialPaymentWallet = null

  try {
    const data = await getCachedRegisterMinerData()
    initialMinerTiers = data.initialMinerTiers
    initialPaymentWallet = data.initialPaymentWallet
  } catch {
    // Keep nulls so client fallback fetch can recover.
  }

  return (
    <RegistrationFlow
      initialMinerSlug={MINER_SLUG}
      initialMinerTiers={initialMinerTiers}
      initialPaymentWallet={initialPaymentWallet}
      logo="/beanstock-logo.svg"
      logoAlt="Beanstock"
      homeHref="https://beanstockinvestor.com"
    />
  )
}
