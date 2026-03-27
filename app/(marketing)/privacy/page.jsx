import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — Hyperscaled',
  description:
    'How Taoshi VT Services collects, uses, discloses, and protects your personal information across the Vanta Trading and Hyperscaled platforms.',
  ogTitle: 'Privacy Policy — Vanta Trading & Hyperscaled',
  ogDescription:
    'Unified privacy policy covering data collection, cookies, your rights (GDPR, CCPA/CPRA), data retention, and security practices for Vanta Trading and Hyperscaled.',
  path: '/privacy',
})

export default function Privacy() {
  return <PrivacyPolicyPage />
}
