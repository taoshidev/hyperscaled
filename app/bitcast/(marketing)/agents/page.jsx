import AgentsPage from '@/components/marketing/AgentsPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'For Agents — AI Agent Trading on HyperFunded',
  description: 'HyperFunded supports AI agents and algorithmic traders. No minimum trading days, automated strategies fully supported.',
  ogTitle: 'HyperFunded for Agents — Deploy Your AI Trading Agent, Get Scaled',
  ogDescription: 'Scaled trading for AI agents and algorithmic strategies. No restrictions on automation. Connect, trade, and earn USDC onchain.',
  path: '/bitcast/agents',
  brand: 'bitcast',
})

export default function BitcastAgentsPage() {
  return <AgentsPage />
}
