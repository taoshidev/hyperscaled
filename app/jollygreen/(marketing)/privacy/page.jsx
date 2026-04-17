import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — Jolly Green Investor',
  description: 'Privacy policy for Jolly Green Investor.',
  path: '/jollygreen/privacy',
  brand: 'jollygreen',
})

export default function JollyGreenPrivacy() {
  return <PrivacyPolicyPage />
}
