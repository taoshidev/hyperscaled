import PricingPage from '@/components/marketing/PricingPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { fetchDbPricingTiers } from '@/lib/pricing-db'

export const metadata = buildMetadata({
  title: 'Pricing — Hyperstack Trading Challenges',
  description: 'One-time USDC fee. $5K to $100K simulated scaled accounts. One-step Challenge, USDC rewards, no subscriptions, no hidden charges.',
  ogTitle: 'Hyperstack Pricing — One Fee. One Challenge. USDC Rewards.',
  ogDescription:
    'Start from $59. Choose $5K to $100K simulated scaled accounts. USDC rewards and scaling up to $400K.',
  path: '/bitcast/pricing',
  brand: 'bitcast',
})

export default async function BitcastPricing() {
  const tiers = await fetchDbPricingTiers('bitcast')
  const productSchemas = tiers.map((tier) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Hyperstack ${tier.name} Challenge Account`,
    description: `${tier.accountSize} simulated scaled trading account on Hyperliquid. 10% profit target, 5% max drawdown.`,
    offers: { "@type": "Offer", price: String(tier.launchPrice), priceCurrency: "USD", availability: "https://schema.org/InStock", url: "https://hyperstack.trade/register" },
  }))
  return (
    <>
      {productSchemas.map((schema, i) => <JsonLd key={i} data={schema} />)}
      <PricingPage tiers={tiers} />
    </>
  )
}
