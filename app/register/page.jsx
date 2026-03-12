import { RegistrationFlow } from "@/components/registration/registration-flow";

export const metadata = {
  title: "Start Your Evaluation | Hyperscaled",
  description:
    "Choose your funded account size and begin your one-step evaluation on Hyperliquid. No recurring fees. 100% of performance rewards are yours.",
};

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return <RegistrationFlow />;
}
