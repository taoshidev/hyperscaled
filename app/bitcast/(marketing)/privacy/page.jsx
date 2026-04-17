import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — Bitcast',
  description: 'Privacy policy for Bitcast scaled trading.',
  path: '/bitcast/privacy',
  brand: 'bitcast',
})

export default function BitcastPrivacy() {
  return <PrivacyPolicyPage />
}
