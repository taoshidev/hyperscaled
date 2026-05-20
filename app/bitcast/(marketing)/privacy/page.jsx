import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — HyperFunded',
  description: 'Privacy policy for HyperFunded scaled trading.',
  path: '/bitcast/privacy',
  brand: 'bitcast',
})

export default function BitcastPrivacy() {
  return <PrivacyPolicyPage />
}
