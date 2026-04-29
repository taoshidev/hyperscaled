import PricingPage from '@/components/marketing/PricingPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { fetchDbPricingTiers } from '@/lib/pricing-db'

export const metadata = buildMetadata({
  title: 'Pricing — Hyperscaled Scaled Trading Accounts',
  description:
    'One-time USDC fee. $5K to $100K scaled accounts. 100% profit split. No subscriptions, no hidden charges.',
  ogTitle: 'Hyperscaled Pricing — One Fee. One Challenge. Keep Everything You Earn.',
  ogDescription:
    'Start from $39. Choose $5K to $100K accounts. 100% profit split, monthly USDC payouts, and scaling up to $2.5M. No subscriptions, ever.',
  path: '/pricing',
})


export default async function Pricing() {
  const tiers = await fetchDbPricingTiers()
  const productSchemas = tiers.map((tier) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Hyperscaled ${tier.name} Funded Account`,
    description: `${tier.accountSize} scaled trading account on Hyperliquid. 10% profit target, 5% max drawdown, ${tier.profitSplit} profit split, monthly USDC payouts. Scale ${tier.scalingPath}.`,
    offers: {
      "@type": "Offer",
      price: String(tier.launchPrice),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${process.env.HYPERSCALED_BASE_URL || "https://hyperscaled.trade"}/register`,
    },
  }))

  return (
    <>
      {productSchemas.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <PricingPage tiers={tiers} />
    </>
  )
}
