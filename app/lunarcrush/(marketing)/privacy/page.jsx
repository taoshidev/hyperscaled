import PrivacyPolicyPage from '@/components/marketing/PrivacyPolicyPage'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Privacy Policy — LunarCrush',
  description: 'Privacy policy for LunarCrush scaled trading.',
  path: '/lunarcrush/privacy',
  brand: 'lunarcrush',
})

export default function LunarCrushPrivacy() {
  return <PrivacyPolicyPage />
}
