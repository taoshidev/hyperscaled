import { StatusChecker } from "@/components/status/status-checker"
import { buildMetadata } from "@/lib/metadata"

export const dynamic = 'force-dynamic'

export const metadata = buildMetadata({
  title: "Registration Status — Beanstock",
  description: "Check your registration status on Beanstock.",
  path: "/beanstock/status",
  brand: "beanstock",
})

export default function BeanstockStatusPage() {
  return <StatusChecker />
}
