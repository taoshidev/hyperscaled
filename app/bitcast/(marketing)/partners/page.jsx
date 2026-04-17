import PartnersPage from '@/components/marketing/PartnersPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Partners — Run Your Own Scaled Trading Firm',
  description: 'Launch a fully branded prop trading firm on Bitcast infrastructure. Set your pricing. Generate revenue.',
  ogTitle: 'Bitcast Partners — Run Your Own Scaled Trading Firm',
  ogDescription: 'White-label prop trading infrastructure powered by Bitcast. Set your own pricing, generate revenue, fund your traders.',
  path: '/bitcast/partners',
  brand: 'bitcast',
})

export default function BitcastPartners() {
  return <PartnersPage />
}
