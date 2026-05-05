import { BuilderCodeForm } from "@/components/builder/builder-code-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Builder Code | Hyperscaled",
  description:
    "Approve the Hyperscaled builder fee on Hyperliquid so your orders can route through the network.",
  openGraph: {
    title: "Builder Code | Hyperscaled",
    description:
      "Approve the Hyperscaled builder fee on Hyperliquid so your orders can route through the network.",
    url: "/builder",
  },
};

export default function BuilderPage() {
  return <BuilderCodeForm />;
}
