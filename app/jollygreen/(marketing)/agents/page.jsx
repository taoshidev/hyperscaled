import AgentsPage from '@/components/marketing/AgentsPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'For Agents — AI Agent Trading on Jolly Green Investor',
  description:
    'Jolly Green Investor is built for AI agents and algorithmic traders. No minimum trading days, automated strategies fully supported.',
  ogTitle: 'Jolly Green Investor for Agents — Deploy Your AI Trading Agent, Get Funded',
  ogDescription:
    'Funded trading for AI agents and algorithmic strategies. No restrictions on automation. Connect, trade, and earn USDC onchain.',
  path: '/jollygreen/agents',
  brand: 'jollygreen',
})

export default function JollyGreenAgentsPage() {
  return <AgentsPage />
}
