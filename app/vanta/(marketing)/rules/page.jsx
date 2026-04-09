import RulesPage from '@/components/marketing/RulesPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Trading Rules — Vanta Trading Challenge & Funded Account',
  description:
    'All Vanta Trading rules in one place. 10% profit target, 5% drawdown, no time limit, 100% profit split, monthly payout cycles.',
  ogTitle: 'Vanta Trading Rules — Transparent, Fair, and Onchain',
  ogDescription:
    'Every challenge and funded account rule in one place. 10% profit target, 5% drawdown limit, 100% profit split, monthly USDC payouts.',
  path: '/vanta/rules',
  brand: 'vanta',
})

export default function VantaRules() {
  return <RulesPage />
}
