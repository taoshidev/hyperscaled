import PricingPage from '@/components/marketing/PricingPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { fetchDbPricingTiers } from '@/lib/pricing-db'
import { pricingMinerSlugForBrandId } from '@/lib/pricing-miner-slug'
import {
  resolveActiveCampaign,
  serializeActiveCampaign,
} from '@/lib/campaign-pricing'

export const dynamic = 'force-dynamic'

export const metadata = buildMetadata({
  title: 'Pricing — Beanstock Simulated Scaled Accounts',
  description:
    'One-time USDC fee. $5K to $100K simulated scaled accounts. USDC rewards. No subscriptions, no hidden charges.',
  ogTitle: 'Beanstock Pricing — One Fee. One Challenge. A Vanta-Powered Simulated Scaled Account.',
  ogDescription:
    'Start from $59. Choose $5K to $100K accounts. USDC rewards, monthly USDC payouts, and scaling up to $400K.',
  path: '/beanstock/pricing',
  brand: 'beanstock',
})

export default async function BeanstockPricing() {
  const minerSlug = pricingMinerSlugForBrandId('beanstock')
  const activeCampaign = await resolveActiveCampaign({ minerSlug }).catch(
    () => null,
  )
  const tiers = await fetchDbPricingTiers(minerSlug, { activeCampaign })
  const productSchemas = tiers.map((tier) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Beanstock ${tier.name} Simulated Scaled Account`,
    description: `${tier.accountSize} simulated scaled account on Hyperliquid. 10% profit target, 5% max drawdown. Performance-based rewards for invited Scaled Trader Program participants.`,
    offers: {
      "@type": "Offer",
      price: String(tier.launchPrice),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://hyperscaled.trade/beanstock/register",
    },
  }))

  return (
    <>
      {productSchemas.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <PricingPage
        tiers={tiers}
        activeCampaign={serializeActiveCampaign(activeCampaign)}
      />
    </>
  )
}
