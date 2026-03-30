import { TestnetRegistrationFlow } from "@/components/registration/testnet-registration-flow";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Testnet Registration",
  description:
    "Register for the Hyperscaled testnet. No payment required — enter your details and start trading on testnet.",
  ogTitle: "Testnet Registration — Hyperscaled",
  ogDescription:
    "Join the Hyperscaled testnet. Enter your info, get a funded testnet account, and start trading on Hyperliquid.",
  path: "/testnet-register",
});

export const dynamic = "force-dynamic";

export default function TestnetRegisterPage() {
  return <TestnetRegistrationFlow />;
}
