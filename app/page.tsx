"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "One-Step Evaluation",
    description:
      "Hit an 8% profit target to earn your funded account and keep 100% of profits.",
  },
  {
    title: "Grow Your Account",
    description:
      "Consistent performance unlocks larger account sizes, with scaling up to $2.5M.",
  },
  {
    title: "USDC In, USDC Out",
    description:
      "Pay and get paid in USDC. Payouts go directly to your wallet with no conversion fees.",
  },
  {
    title: "Verifiable Payouts",
    description:
      "All payouts are verifiable, transparent, and tracked onchain. No exceptions.",
  },
  {
    title: "No Gatekeepers",
    description:
      "Permissionless trading on Hyperliquid. You bring the skill, we bring the funding.",
  },
  {
    title: "Transparent Rules",
    description:
      "All evaluation rules are simple and clear. No hidden or opaque rules.",
  },
];

const stats = [
  { value: "100%", label: "Profit Split" },
  { value: "$30M+", label: "Paid Out to Traders" },
  { value: "$2.5M", label: "Scaling up to" },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Email submitted:", email);
    setShowSuccess(true);
    setEmail("");
    setTimeout(() => setShowSuccess(false), 5000);
  }

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <div className="text-lg tracking-tight">
            Hyper<span className="font-semibold">funded</span>
          </div>
          <div className="text-[13px] text-white/40">
            Powered by{" "}
            <a
              href="#"
              className="text-white/60 transition-colors hover:text-white/90"
            >
              Vanta Network
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero */}
        <section className="px-6 pb-20 pt-28 text-center">
          <div className="mx-auto max-w-5xl">
            <h1 className="mx-auto max-w-4xl text-5xl font-normal leading-[1.1] tracking-[-0.04em] md:text-7xl">
              Trade on Hyperliquid. Earn a Funded Account. Keep 100% of Your
              Profits.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg font-light leading-relaxed text-white/50">
              Pass a simple evaluation, keep your profits, and scale your
              account up to $2.5M.
            </p>
          </div>
        </section>

        {/* Waitlist Form */}
        <section className="px-6">
          <div className="mx-auto max-w-md">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 flex-1 border-white/[0.08] bg-white/[0.04] text-[15px] text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:bg-white/[0.06] focus-visible:ring-0"
              />
              <Button
                type="submit"
                className="h-12 rounded-md bg-white px-7 text-[15px] font-normal text-black hover:bg-white/90 active:scale-[0.98]"
              >
                Join waitlist
              </Button>
            </form>
            {showSuccess && (
              <div className="mt-3 rounded-md border border-green-500/20 bg-green-500/10 px-3 py-3 text-center text-sm text-green-500">
                Added to waitlist
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="px-6">
          <div className="mx-auto mt-28 max-w-3xl border-y border-white/[0.06] py-20">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
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
        <section className="px-6 pb-28 pt-28">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-white/[0.06] bg-white/[0.02] shadow-none transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
                >
                  <CardContent className="pt-2">
                    <h3 className="mb-3 text-base font-normal tracking-[-0.01em]">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-light leading-relaxed text-white/50">
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
      <footer className="relative z-10 border-t border-white/[0.06] py-14 text-center">
        <div className="text-[13px] text-white/30">
          &copy; 2026 Hyperfunded
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
