import RulesPage from '@/components/marketing/RulesPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Trading Rules — LunarCrush Challenge & Funded Account',
  description: 'Clear, onchain rules for the LunarCrush challenge and funded accounts. 10% profit target, 5% max drawdown, no time limit.',
  ogTitle: 'LunarCrush Trading Rules — Transparent, Onchain, No Hidden Clauses',
  ogDescription: 'All challenge rules are published onchain. 10% profit target, 5% max drawdown, no time limit, 100% profit split.',
  path: '/lunarcrush/rules',
  brand: 'lunarcrush',
})

export default function LunarCrushRules() {
  return <RulesPage />
}
