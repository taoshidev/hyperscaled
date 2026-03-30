import { RegistrationFlow } from "@/components/registration/registration-flow";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Start Your Challenge",
  description:
    "Choose your funded account size and begin your one-step challenge on Hyperliquid. No recurring fees. 100% of performance rewards are yours.",
  ogTitle: "Start Your Challenge — Hyperscaled Funded Trading",
  ogDescription:
    "Choose $25K, $50K, or $100K. One-time USDC fee. Pass the challenge. Keep 100% of your profits.",
  path: "/register",
});

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return <RegistrationFlow />;
}
