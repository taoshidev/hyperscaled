import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — Hyperstack',
  description: 'Privacy policy for Hyperstack scaled trading.',
  path: '/bitcast/privacy',
  brand: 'bitcast',
})

export default function BitcastPrivacy() {
  return <PrivacyPolicyPage />
}
