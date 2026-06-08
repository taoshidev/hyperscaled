import HowItWorksPage from '@/components/marketing/HowItWorksPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { fetchDbPricingTiers } from '@/lib/pricing-db'
import { pricingMinerSlugForBrandId } from '@/lib/pricing-miner-slug'
import { resolveActiveCampaign } from '@/lib/campaign-pricing'

export const metadata = buildMetadata({
  title: 'How It Works — HyperFunded',
  description: 'See how HyperFunded works. Connect your wallet, trade on Hyperliquid, pass the challenge, and keep 100% of eligible USDC rewards.',
  ogTitle: 'How HyperFunded Works — Trade on Hyperliquid, Get Scaled, Keep 100%',
  ogDescription: 'No API keys. No custody. Register, trade on Hyperliquid, pass the 1-step challenge, and keep 100% of eligible USDC rewards.',
  path: '/bitcast/how-it-works',
  brand: 'bitcast',
})

const HOW_TO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to get a scaled trading account on HyperFunded",
  description: "Connect your wallet, trade perps on Hyperliquid, pass the 1-step challenge, and keep 100% of eligible USDC rewards.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Start Your Challenge", text: "Choose your account size from $5K to $100K, pay a one-time USDC fee, and begin your one-step challenge. No subscriptions, no second phase, no time limit." },
    { "@type": "HowToStep", position: 2, name: "Trade Perps on Hyperliquid", text: "Connect your Hyperliquid wallet and trade the way you already do. Same market, same interface, same trading flow. HyperFunded reads your performance in the background." },
    { "@type": "HowToStep", position: 3, name: "Track your progress", text: "Monitor your challenge progress in real time via the dashboard. 10% profit target, 5% max drawdown, no time limit." },
    { "@type": "HowToStep", position: 4, name: "Hit the Target. Get Scaled.", text: "Hit the 10% profit target while staying inside the 5% drawdown rules. Once you pass, your scaled account is activated and you keep 100% of eligible performance rewards." },
  ],
}

export default async function BitcastHowItWorks() {
  const minerSlug = pricingMinerSlugForBrandId('bitcast')
  const activeCampaign = await resolveActiveCampaign({ minerSlug }).catch(
    () => null,
  )
  const tiers = await fetchDbPricingTiers(minerSlug, { activeCampaign })
  return (
    <>
      <JsonLd data={HOW_TO_SCHEMA} />
      <HowItWorksPage tiers={tiers} />
    </>
  )
}
