import TermsOfServicePage from '@/components/marketing/TermsOfServicePage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Terms of Service — LunarCrush',
  description: 'Terms of service for LunarCrush scaled trading.',
  path: '/lunarcrush/terms',
  brand: 'lunarcrush',
})

export default function LunarCrushTerms() {
  return <TermsOfServicePage />
}
