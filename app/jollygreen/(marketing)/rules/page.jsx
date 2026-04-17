import RulesPage from '@/components/marketing/RulesPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Trading Rules — Jolly Green Investor Challenge & Funded Account',
  description:
    'Clear, onchain rules for the Jolly Green Investor challenge and funded accounts. 10% profit target, 5% max drawdown, no time limit.',
  ogTitle: 'Jolly Green Investor Trading Rules — Transparent, Onchain, No Hidden Clauses',
  ogDescription:
    'All challenge rules are published onchain. 10% profit target, 5% max drawdown, no time limit, 100% profit split.',
  path: '/jollygreen/rules',
  brand: 'jollygreen',
})

export default function JollyGreenRules() {
  return <RulesPage />
}
