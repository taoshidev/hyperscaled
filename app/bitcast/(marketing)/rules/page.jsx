import RulesPage from '@/components/marketing/RulesPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Trading Rules — Bitcast Challenge & Funded Account',
  description: 'Clear, onchain rules for the Bitcast challenge and funded accounts. 10% profit target, 5% max drawdown, no time limit.',
  ogTitle: 'Bitcast Trading Rules — Transparent, Onchain, No Hidden Clauses',
  ogDescription: 'All challenge rules are published onchain. 10% profit target, 5% max drawdown, no time limit, 100% profit split.',
  path: '/bitcast/rules',
  brand: 'bitcast',
})

export default function BitcastRules() {
  return <RulesPage />
}
