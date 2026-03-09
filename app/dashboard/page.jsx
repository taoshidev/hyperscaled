import { Dashboard } from "@/components/dashboard/dashboard";

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Trading Dashboard | Hyperscaled",
  description: "Monitor your entity miner trading activity in real-time",
};

export default function DashboardPage() {
  return <Dashboard />;
}
