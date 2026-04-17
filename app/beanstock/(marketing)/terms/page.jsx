import TermsOfServicePage from '@/components/marketing/TermsOfServicePage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Terms of Service — Beanstock',
  description: 'Terms of service for Beanstock.',
  path: '/beanstock/terms',
  brand: 'beanstock',
})

export default function BeanstockTerms() {
  return <TermsOfServicePage />
}
