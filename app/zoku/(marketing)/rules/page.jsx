import RulesPage from '@/components/marketing/RulesPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Trading Rules — Zoku Challenge & Funded Account',
  description:
    'All Zoku rules in one place. 10% profit target, 5% drawdown, no time limit, 100% profit split, monthly payout cycles.',
  ogTitle: 'Zoku Rules — Transparent, Fair, and Onchain',
  ogDescription:
    'Every challenge and scaled account rule in one place. 10% profit target, 5% drawdown limit, 100% profit split, monthly USDC payouts.',
  path: '/zoku/rules',
  brand: 'zoku',
})

export default function ZokuRules() {
  return <RulesPage />
}
