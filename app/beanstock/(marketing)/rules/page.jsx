import RulesPage from '@/components/marketing/RulesPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Trading Rules — Beanstock Challenge & Simulated Scaled Account',
  description:
    'Clear, onchain rules for the Beanstock challenge and simulated scaled accounts. 10% profit target, 5% max drawdown, no time limit.',
  ogTitle: 'Beanstock Trading Rules — Transparent, Onchain, No Hidden Clauses',
  ogDescription:
    'All challenge rules are published onchain. 10% profit target, 5% max drawdown, no time limit, USDC rewards.',
  path: '/beanstock/rules',
  brand: 'beanstock',
})

export default function BeanstockRules() {
  return <RulesPage />
}
