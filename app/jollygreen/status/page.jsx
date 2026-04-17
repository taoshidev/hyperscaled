import { StatusChecker } from "@/components/status/status-checker"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Registration Status | Jolly Green Investor",
  description: "Check your registration status",
}

export default function JollyGreenStatusPage() {
  return <StatusChecker />
}
