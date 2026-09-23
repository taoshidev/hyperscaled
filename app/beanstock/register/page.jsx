import RegistrationClosed from "@/components/registration/registration-closed"
import { buildMetadata } from "@/lib/metadata"
import { REGISTRATION_CLOSED_COPY } from "@/lib/sunset"

// Notion #1560: new registrations are closed on every brand. The route stays
// so inbound links land on the closure notice instead of a 404.
export const metadata = buildMetadata({
  title: REGISTRATION_CLOSED_COPY.heading,
  description: REGISTRATION_CLOSED_COPY.body,
  path: "/beanstock/register",
  robots: { index: false, follow: true },
  brand: "beanstock",
})

export default function RegisterPage() {
  return <RegistrationClosed logoHref="https://beanstocktrading.com" />
}
