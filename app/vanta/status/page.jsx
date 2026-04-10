import { StatusChecker } from "@/components/status/status-checker"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Registration Status | Vanta Trading",
  description: "Check your registration status",
}

export default function VantaStatusPage() {
  return <StatusChecker />
}
