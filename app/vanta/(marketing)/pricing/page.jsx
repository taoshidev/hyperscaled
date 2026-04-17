import PricingPage from '@/components/marketing/PricingPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { PRICING_TIERS } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Pricing — Vanta Trading Funded Accounts',
  description:
    'One-time USDC fee. $5K to $100K scaled accounts. 100% profit split. No subscriptions, no hidden charges.',
  ogTitle: 'Vanta Trading Pricing — One Fee. One Challenge. Keep Everything You Earn.',
  ogDescription:
    'Start from $39. Choose $5K to $100K accounts. 100% profit split, monthly USDC payouts, and scaling up to $2.5M.',
  path: '/vanta/pricing',
  brand: 'vanta',
})

export default async function VantaPricing() {
  const productSchemas = PRICING_TIERS.map((tier) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Vanta Trading ${tier.name} Funded Account`,
    description: `${tier.accountSize} scaled trading account on Hyperliquid. 10% profit target, 5% max drawdown, ${tier.profitSplit} profit split.`,
    offers: {
      "@type": "Offer",
      price: String(tier.launchPrice),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://vantatrading.io/vanta/register",
    },
  }))

  return (
    <>
      {productSchemas.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <PricingPage tiers={PRICING_TIERS} />
    </>
  )
}
