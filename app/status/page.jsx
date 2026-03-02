import { StatusChecker } from "@/components/status/status-checker";

export const metadata = {
  title: "Registration Status | Hyperscaled",
  description: "Check your entity miner registration status",
};

export default function StatusPage() {
  return <StatusChecker />;
}
