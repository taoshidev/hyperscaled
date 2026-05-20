import TermsOfServicePage from '@/components/marketing/TermsOfServicePage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Terms of Service — Vanta Trading',
  description:
    'Vanta Trading Challenge Terms of Service governing your access to and use of the platform and participation in the Challenge.',
  ogTitle: 'Terms of Service — Vanta Trading',
  ogDescription:
    'Terms of Service for the Vanta Trading Challenge evaluation program.',
  path: '/vanta/terms',
  brand: 'vanta',
})

export default function VantaTerms() {
  return <TermsOfServicePage />
}
