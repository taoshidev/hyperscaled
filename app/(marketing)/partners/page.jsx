import PartnersPage from '@/components/marketing/PartnersPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Partners — Run Your Own Scaled Trading Firm',
  description:
    'Launch a fully branded prop trading firm on Hyperscaled infrastructure. Set your pricing. Generate revenue. The network handles evaluation, enforcement, and payouts.',
  ogTitle: 'Hyperscaled Partners — Run Your Own Scaled Trading Firm',
  ogDescription:
    'White-label prop trading infrastructure powered by Hyperscaled. Set your own pricing, generate revenue, fund your traders. Operational in days, not months. Apply now.',
  path: '/partners',
})

export default function Partners() {
  return <PartnersPage />
}
