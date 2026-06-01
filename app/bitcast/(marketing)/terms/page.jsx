import TermsOfServicePage from '@/components/marketing/TermsOfServicePage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Terms of Service — Hyperstack',
  description: 'Terms of service for Hyperstack scaled trading.',
  path: '/bitcast/terms',
  brand: 'bitcast',
})

export default function BitcastTerms() {
  return <TermsOfServicePage />
}
