import TermsOfServicePage from '@/components/marketing/TermsOfServicePage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Terms of Service — Hyperscaled',
  description:
    'Hyperscaled Challenge Terms of Service governing your access to and use of the Hyperscaled Challenge platform and participation in the Challenge.',
  ogTitle: 'Terms of Service — Hyperscaled',
  ogDescription:
    'Terms of Service for the Hyperscaled Challenge evaluation program, covering fees, eligibility, conduct, dispute resolution, and more.',
  path: '/terms',
})

export default function Terms() {
  return <TermsOfServicePage />
}
