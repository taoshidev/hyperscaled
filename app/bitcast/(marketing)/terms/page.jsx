import TermsOfServicePage from '@/components/marketing/TermsOfServicePage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Terms of Service — HyperFunded',
  description: 'Terms of service for HyperFunded scaled trading.',
  path: '/bitcast/terms',
  brand: 'bitcast',
})

export default function BitcastTerms() {
  return <TermsOfServicePage />
}
