import PartnersPage from '@/components/marketing/PartnersPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Partners — Run Your Own Scaled Trading Firm',
  description:
    'Launch a fully branded prop trading firm on Beanstock infrastructure. Set your pricing. Generate revenue.',
  ogTitle: 'Beanstock Partners — Run Your Own Scaled Trading Firm',
  ogDescription:
    'White-label prop trading infrastructure powered by Beanstock. Set your own pricing, generate revenue, fund your traders.',
  path: '/beanstock/partners',
  brand: 'beanstock',
})

export default function BeanstockPartners() {
  return <PartnersPage />
}
