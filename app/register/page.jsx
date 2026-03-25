import { RegistrationFlow } from "@/components/registration/registration-flow";

export const metadata = {
  title: "Start Your Challenge | Hyperscaled",
  description:
    "Choose your funded account size and begin your one-step challenge on Hyperliquid. No recurring fees. 100% of performance rewards are yours.",
};

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return <RegistrationFlow />;
}
