import TermsOfServicePage from '@/components/marketing/TermsOfServicePage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Terms of Service — Jolly Green Investor',
  description: 'Terms of service for Jolly Green Investor.',
  path: '/jollygreen/terms',
  brand: 'jollygreen',
})

export default function JollyGreenTerms() {
  return <TermsOfServicePage />
}
