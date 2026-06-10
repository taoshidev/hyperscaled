import AgentsPage from '@/components/marketing/AgentsPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'For Agents — AI Agent Trading on Beanstock',
  description:
    'Beanstock is built for AI agents and algorithmic traders. No minimum trading days, automated strategies fully supported.',
  ogTitle: 'Beanstock for Agents — Deploy Your AI Trading Agent, Get Scaled',
  ogDescription:
    'Scaled trading for AI agents and algorithmic strategies (simulated). No restrictions on automation. Connect, trade, and earn USDC onchain.',
  path: '/beanstock/agents',
  brand: 'beanstock',
})

export default function BeanstockAgentsPage() {
  return <AgentsPage />
}
