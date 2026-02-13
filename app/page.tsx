"use client";

import { useHubspotForm } from "next-hubspot";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "One-Step Evaluation",
    description:
      "Trade, perform, and unlock funded capital through a transparent, rules-based evaluation.",
  },
  {
    title: "Grow Your Account",
    description:
      "Strong performance unlocks access to more capital, with scaling up to $2.5M.",
  },
  {
    title: "USDC In, USDC out",
    description:
      "Pay and get paid in USDC. Payouts go directly to your wallet with no withdrawal fees.",
  },
  {
    title: "Onchain Transparency",
    description:
      "Every payout is tracked on-chain, powered by decentralized infrastructure. No exceptions.",
  },
  {
    title: "Trade on Hyperliquid",
    description:
      "Use the platform you know and love. You bring the skill, we bring the funding.",
  },
  {
    title: "Transparent Rules",
    description:
      "All evaluation rules are clear and open-source. Nothing hidden or opaque.",
  },
];

const stats = [
  { value: "100%", label: "You Keep Your Profits" },
  { value: "$30M+", label: "Paid Out to Traders" },
  { value: "$2.5M", label: "Scaling up to" },
];

export default function Home() {
  useHubspotForm({
    portalId: "45009699",
    formId: "945b5d9c-3356-4673-a669-d1cacd444c5d",
    target: "#hubspot-form-wrapper",
    cssRequired: "",
    submitText: "Join the Waitlist",
  });

  return (
    <>
      {/* Animated Liquid Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute -left-1/2 -top-1/2 h-[200%] w-[200%] blur-[80px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.10) 25%, rgba(29,78,216,0.06) 50%, transparent 70%)",
            animation: "liquidMove 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -left-1/2 -top-1/2 h-[200%] w-[200%] blur-[80px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(147,51,234,0.12) 0%, rgba(126,34,206,0.08) 25%, rgba(107,33,168,0.04) 50%, transparent 70%)",
            animation: "liquidMove2 25s ease-in-out infinite",
            animationDelay: "-5s",
          }}
        />
        <div
          className="absolute -left-1/2 -top-1/2 h-[200%] w-[200%] blur-[80px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(6,182,212,0.14) 0%, rgba(14,165,233,0.09) 25%, rgba(2,132,199,0.05) 50%, transparent 70%)",
            animation: "liquidMove3 30s ease-in-out infinite",
            animationDelay: "-10s",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6">
          <img
            src="/hyperscaled-wordmark.svg"
            alt="Hyperscaled"
            className="h-8"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero */}
        <section className="px-6 pb-20 pt-[120px] text-center">
          <div className="mx-auto max-w-[1280px]">
            <h1 className="text-5xl font-normal leading-[1.1] tracking-[-0.04em] md:text-[72px]">
              Permissionless Funded Trading on Hyperliquid
            </h1>
            <p className="mx-auto mb-[60px] mt-6 max-w-[640px] text-lg font-light leading-[1.6] text-white/50">
              Trade with more capital without risking your own stack. Keep 100%
              of your profits. Grow your account to $2.5M.
            </p>
          </div>
        </section>

        {/* Waitlist Form */}
        <section className="mb-[120px] px-6">
          <div className="mx-auto max-w-[480px]">
            <div id="hubspot-form-wrapper" className="hubspot-waitlist" />
          </div>
        </section>

        {/* Stats */}
        <section className="px-6">
          <div className="mx-auto mb-[120px] max-w-[900px] border-y border-white/[0.06] py-20">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center text-center"
                >
                  <div className="text-5xl font-normal tracking-[-0.03em]">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 pb-[120px]">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="gap-0 rounded-lg border-white/[0.06] bg-white/[0.02] p-8 shadow-none transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
                >
                  <CardContent className="p-0">
                    <h3 className="mb-3 text-base font-normal tracking-[-0.01em]">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-light leading-[1.6] text-white/50">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-[60px] text-center">
        <div className="text-[13px] text-white/30">
          &copy; 2026 Hyperscaled
        </div>
        <div className="mt-3 text-[13px] text-white/40">
          Powered by{" "}
          <a
            href="#"
            className="text-white/60 transition-colors hover:text-white/90"
          >
            Vanta Network
          </a>
        </div>
      </footer>
    </>
  );
}
