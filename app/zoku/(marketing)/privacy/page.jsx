import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — Zoku',
  description:
    'How we collect, use, disclose, and protect your personal information across the Zoku platform.',
  ogTitle: 'Privacy Policy — Zoku',
  ogDescription:
    'Privacy policy covering data collection, cookies, your rights, data retention, and security practices for Zoku.',
  path: '/zoku/privacy',
  brand: 'zoku',
})

export default function ZokuPrivacy() {
  return <PrivacyPolicyPage />
}
