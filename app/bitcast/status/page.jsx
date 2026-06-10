import { StatusChecker } from "@/components/status/status-checker"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Registration Status | Hyperstack",
  description: "Check your registration status",
}

export default function BitcastStatusPage() {
  return <StatusChecker />
}
