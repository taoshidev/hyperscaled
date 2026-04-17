import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — Beanstock',
  description: 'Privacy policy for Beanstock.',
  path: '/beanstock/privacy',
  brand: 'beanstock',
})

export default function BeanstockPrivacy() {
  return <PrivacyPolicyPage />
}
