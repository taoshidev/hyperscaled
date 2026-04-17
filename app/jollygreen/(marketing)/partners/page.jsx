import PartnersPage from '@/components/marketing/PartnersPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Partners — Run Your Own Scaled Trading Firm',
  description:
    'Launch a fully branded prop trading firm on Jolly Green Investor infrastructure. Set your pricing. Generate revenue.',
  ogTitle: 'Jolly Green Investor Partners — Run Your Own Scaled Trading Firm',
  ogDescription:
    'White-label prop trading infrastructure powered by Jolly Green Investor. Set your own pricing, generate revenue, fund your traders.',
  path: '/jollygreen/partners',
  brand: 'jollygreen',
})

export default function JollyGreenPartners() {
  return <PartnersPage />
}
