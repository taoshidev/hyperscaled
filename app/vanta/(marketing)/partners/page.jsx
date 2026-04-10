import PartnersPage from '@/components/marketing/PartnersPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Partners — Run Your Own Scaled Trading Firm',
  description:
    'Launch a fully branded prop trading firm on Vanta Trading infrastructure. Set your pricing. Generate revenue.',
  ogTitle: 'Vanta Trading Partners — Run Your Own Scaled Trading Firm',
  ogDescription:
    'White-label prop trading infrastructure powered by Vanta Trading. Set your own pricing, generate revenue, fund your traders.',
  path: '/vanta/partners',
  brand: 'vanta',
})

export default function VantaPartners() {
  return <PartnersPage />
}
