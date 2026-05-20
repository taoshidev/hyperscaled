import PricingPage from '@/components/marketing/PricingPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { fetchDbPricingTiers } from '@/lib/pricing-db'

export const metadata = buildMetadata({
  title: 'Pricing — HyperFunded Trading Challenges',
  description: 'One-time USDC fee. $5K to $100K challenge accounts. One-step challenge, 100% profit split, no subscriptions, no hidden charges.',
  ogTitle: 'HyperFunded Pricing — One Fee. One Challenge. Keep 100% of Rewards.',
  ogDescription:
    'Start from $59. Choose $5K to $100K accounts. 100% profit split, monthly USDC payouts, and scaling up to $400K.',
  path: '/bitcast/pricing',
  brand: 'bitcast',
})

export default async function BitcastPricing() {
  const tiers = await fetchDbPricingTiers('bitcast')
  const productSchemas = tiers.map((tier) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `HyperFunded ${tier.name} Challenge Account`,
    description: `${tier.accountSize} scaled trading account on Hyperliquid. 10% profit target, 5% max drawdown, ${tier.profitSplit} profit split.`,
    offers: { "@type": "Offer", price: String(tier.launchPrice), priceCurrency: "USD", availability: "https://schema.org/InStock", url: "https://hyperfunded.co/bitcast/register" },
  }))
  return (
    <>
      {productSchemas.map((schema, i) => <JsonLd key={i} data={schema} />)}
      <PricingPage tiers={tiers} />
    </>
  )
}
