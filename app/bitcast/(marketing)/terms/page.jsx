import TermsOfServicePage from '@/components/marketing/TermsOfServicePage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Terms of Service — Bitcast',
  description: 'Terms of service for Bitcast scaled trading.',
  path: '/bitcast/terms',
  brand: 'bitcast',
})

export default function BitcastTerms() {
  return <TermsOfServicePage />
}
