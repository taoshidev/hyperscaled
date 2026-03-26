import PricingPage from '@/components/marketing/PricingPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Pricing — Hyperscaled Funded Trading Accounts',
  description:
    'One-time USDC fee. $25K, $50K, or $100K funded accounts. 100% profit split. No subscriptions, no hidden charges.',
  ogTitle: 'Hyperscaled Pricing — One Fee. One Challenge. Keep Everything You Earn.',
  ogDescription:
    'Start from $149. Choose $25K, $50K, or $100K accounts. 100% profit split, USDC payouts every 7 days, and scaling up to $2.5M for $100K accounts. No subscriptions, ever.',
  path: '/pricing',
})

const PRODUCT_SCHEMAS = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Hyperscaled $25K Funded Account",
    description: "$25,000 funded trading account on Hyperliquid. 10% profit target, 5% max drawdown, 100% profit split, weekly USDC payouts. Scale up to $100K.",
    offers: {
      "@type": "Offer",
      price: "149",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://hyperscaled.trade/register",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Hyperscaled $50K Funded Account",
    description: "$50,000 funded trading account on Hyperliquid. 10% profit target, 5% max drawdown, 100% profit split, weekly USDC payouts. Scale up to $100K.",
    offers: {
      "@type": "Offer",
      price: "249",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://hyperscaled.trade/register",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Hyperscaled $100K Funded Account",
    description: "$100,000 funded trading account on Hyperliquid. 10% profit target, 5% max drawdown, 100% profit split, weekly USDC payouts. Scale up to $2.5M.",
    offers: {
      "@type": "Offer",
      price: "499",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://hyperscaled.trade/register",
    },
  },
]

export default function Pricing() {
  return (
    <>
      {PRODUCT_SCHEMAS.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <PricingPage />
    </>
  )
}
