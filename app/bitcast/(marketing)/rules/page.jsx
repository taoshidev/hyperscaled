import RulesPage from '@/components/marketing/RulesPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Trading Rules — Hyperstack Challenge & Simulated Scaled Accounts',
  description: 'All Hyperstack rules in one place. 10% profit target, 5% drawdown, no time limit, USDC rewards, and reward cycles.',
  ogTitle: 'Hyperstack Trading Rules — Transparent, Onchain, No Hidden Clauses',
  ogDescription: 'All Challenge rules are published openly. 10% profit target, 5% max drawdown, no time limit, USDC rewards.',
  path: '/bitcast/rules',
  brand: 'bitcast',
})

export default function BitcastRules() {
  return <RulesPage />
}
