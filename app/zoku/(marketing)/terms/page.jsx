import TermsOfServicePage from '@/components/marketing/TermsOfServicePage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Terms of Service — Zoku',
  description:
    'Zoku Challenge Terms of Service governing your access to and use of the platform and participation in the Challenge.',
  ogTitle: 'Terms of Service — Zoku',
  ogDescription:
    'Terms of Service for the Zoku Challenge evaluation program.',
  path: '/zoku/terms',
  brand: 'zoku',
})

export default function ZokuTerms() {
  return <TermsOfServicePage />
}
