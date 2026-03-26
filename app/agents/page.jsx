import AgentsPage from '@/components/marketing/AgentsPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'For Agents — AI Agent Trading on Hyperscaled',
  description:
    'Hyperscaled is built for AI agents and algorithmic traders. No minimum trading days, automated strategies allowed, fully permissionless. Deploy your agent on Hyperliquid.',
  ogTitle: 'Hyperscaled for Agents — Deploy Your AI Trading Agent, Get Funded',
  ogDescription:
    'Permissionless funded trading for AI agents and algorithmic strategies. No restrictions on automation, no minimum activity requirements. Connect, trade, and earn USDC onchain.',
  path: '/agents',
})

export default function AgentsPageRoute() {
  return <AgentsPage />
}
