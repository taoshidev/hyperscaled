import RegistrationClosed from '@/components/registration/registration-closed'
import { buildMetadata } from '@/lib/metadata'
import { REGISTRATION_CLOSED_COPY } from '@/lib/sunset'

// Notion #1560: this pre-registration bridge only led into signup, which is
// closed. The layout keeps the site nav, so render the notice embedded.
export const metadata = buildMetadata({
  title: REGISTRATION_CLOSED_COPY.heading,
  description: REGISTRATION_CLOSED_COPY.body,
  path: '/vanta/start',
  robots: { index: false, follow: true },
  brand: 'vanta',
})

export default function StartPage() {
  return <RegistrationClosed embedded />
}
