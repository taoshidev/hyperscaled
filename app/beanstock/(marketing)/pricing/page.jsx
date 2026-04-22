import PricingPage from '@/components/marketing/PricingPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Pricing — Beanstock Funded Accounts',
  description:
    'One-time USDC fee. $5K to $100K scaled accounts. 100% profit split. No subscriptions, no hidden charges.',
  ogTitle: 'Beanstock Pricing — One Fee. One Challenge. Keep Everything You Earn.',
  ogDescription:
    'Start from $59. Choose $5K to $100K accounts. 100% profit split, monthly USDC payouts, and scaling up to $2.5M.',
  path: '/beanstock/pricing',
  brand: 'beanstock',
})

const BEANSTOCK_TIERS = [
  { id: 'tier-1', name: '$5K Account', accountSize: '$5,000', launchPrice: 59, profitTarget: '10%', profitTargetAmount: '$500', maxDrawdown: '5%', maxDrawdownAmount: '$250', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $100K', timeLimit: 'None', cta: 'Start $5K Challenge', popular: false },
  { id: 'tier-2', name: '$10K Account', accountSize: '$10,000', launchPrice: 109, profitTarget: '10%', profitTargetAmount: '$1,000', maxDrawdown: '5%', maxDrawdownAmount: '$500', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $100K', timeLimit: 'None', cta: 'Start $10K Challenge', popular: false },
  { id: 'tier-3', name: '$25K Account', accountSize: '$25,000', launchPrice: 239, profitTarget: '10%', profitTargetAmount: '$2,500', maxDrawdown: '5%', maxDrawdownAmount: '$1,250', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $100K', timeLimit: 'None', cta: 'Start $25K Challenge', popular: false },
  { id: 'tier-4', name: '$50K Account', accountSize: '$50,000', launchPrice: 499, profitTarget: '10%', profitTargetAmount: '$5,000', maxDrawdown: '5%', maxDrawdownAmount: '$2,500', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $100K', timeLimit: 'None', cta: 'Start $50K Challenge', popular: false },
  { id: 'tier-5', name: '$100K Account', accountSize: '$100,000', launchPrice: 799, profitTarget: '10%', profitTargetAmount: '$10,000', maxDrawdown: '5%', maxDrawdownAmount: '$5,000', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $2.5M', timeLimit: 'None', cta: 'Start $100K Challenge', popular: true },
]

export default async function BeanstockPricing() {
  const productSchemas = BEANSTOCK_TIERS.map((tier) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Beanstock ${tier.name} Funded Account`,
    description: `${tier.accountSize} scaled trading account on Hyperliquid. 10% profit target, 5% max drawdown, ${tier.profitSplit} profit split.`,
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
      <PricingPage />
    </>
  )
}
