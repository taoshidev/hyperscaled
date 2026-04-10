import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — Hyperscaled',
  description:
    'How we collect, use, disclose, and protect your personal information across the Hyperscaled platform.',
  ogTitle: 'Privacy Policy — Hyperscaled',
  ogDescription:
    'Privacy policy covering data collection, cookies, your rights, data retention, and security practices for Hyperscaled.',
  path: '/vanta/privacy',
  brand: 'vanta',
})

export default function VantaPrivacy() {
  return <PrivacyPolicyPage />
}
