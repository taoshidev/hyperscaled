import PartnersPage from '@/components/marketing/PartnersPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Partners — Run Your Own Scaled Trading Firm',
  description: 'Launch a fully branded prop trading firm on LunarCrush infrastructure. Set your pricing. Generate revenue.',
  ogTitle: 'LunarCrush Partners — Run Your Own Scaled Trading Firm',
  ogDescription: 'White-label prop trading infrastructure powered by LunarCrush. Set your own pricing, generate revenue, fund your traders.',
  path: '/lunarcrush/partners',
  brand: 'lunarcrush',
})

export default function LunarCrushPartners() {
  return <PartnersPage />
}
