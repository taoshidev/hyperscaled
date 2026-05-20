import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — Vanta Trading',
  description:
    'How we collect, use, disclose, and protect your personal information across the Vanta Trading platform.',
  ogTitle: 'Privacy Policy — Vanta Trading',
  ogDescription:
    'Privacy policy covering data collection, cookies, your rights, data retention, and security practices for Vanta Trading.',
  path: '/vanta/privacy',
  brand: 'vanta',
})

export default function VantaPrivacy() {
  return <PrivacyPolicyPage />
}
