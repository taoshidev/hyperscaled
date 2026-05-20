import RulesPage from '@/components/marketing/RulesPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Trading Rules — Hyperscaled Challenge & Funded Account',
  description:
    'All Hyperscaled rules in one place. 10% profit target, 5% drawdown, no time limit, 100% profit split, monthly payout cycles. Transparent and enforced onchain.',
  ogTitle: 'Hyperscaled Rules — Transparent, Fair, and Onchain',
  ogDescription:
    'Every challenge and scaled account rule in one place. 10% profit target, 5% drawdown limit, 100% profit split, monthly USDC payouts. No discretionary overrides. Ever.',
  path: '/rules',
})

export default function Rules() {
  return <RulesPage />
}
