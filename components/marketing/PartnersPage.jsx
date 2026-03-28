'use client'

import {
  ArrowRight,
  CheckCircle,
  CurrencyDollar,
  ChartPie,
  Wallet,
  PaintBrush,
  ArrowsOutSimple,
  Lightning,
} from '@phosphor-icons/react'

/* ───────────────────────────────────────────────
   Data
   ─────────────────────────────────────────────── */

const WHAT_YOU_CONTROL = [
  {
    title: 'Set your own pricing',
    body: 'Choose your challenge fees across $25K, $50K, and $100K\u00a0tiers',
    icon: CurrencyDollar,
  },
  {
    title: 'Set your profit split',
    body: 'Define what traders keep and what you retain as the\u00a0operator.',
    icon: ChartPie,
  },
  {
    title: 'Receive payments directly',
    body: 'Trader fees route to your wallet. Hyperscaled never intermediates your\u00a0revenue.',
    icon: Wallet,
  },
  {
    title: 'Full white-label branding',
    body: 'Your firm name, your logo, your positioning. Fully\u00a0branded.',
    icon: PaintBrush,
  },
  {
    title: 'Permissionless scaling',
    body: 'No ceiling on how many traders you can\u00a0fund.',
    icon: ArrowsOutSimple,
  },
  {
    title: 'Network-aligned incentives',
    body: 'When your traders perform, the underlying network directly rewards your\u00a0firm.',
    icon: Lightning,
  },
]

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Apply and get onboarded',
    body: 'Submit your application. Hyperscaled whitegloves your firm setup and infrastructure\u00a0configuration.',
  },
  {
    title: 'Configure your firm',
    body: 'Set your pricing, profit split, and branding. Your firm gets its own Hyperscaled-powered\u00a0experience.',
  },
  {
    title: 'Bring your traders',
    body: 'Market your firm to your audience. Trader USDC payments route directly to your\u00a0wallet.',
  },
  {
    title: 'Scale with the network',
    body: 'As your traders perform, you earn Alpha emissions that expand your funding capacity. More traders = more\u00a0revenue.',
  },
]

const OPERATOR_RESPONSIBILITIES = [
  'Trader acquisition and marketing',
  'Setting pricing and profit split economics',
  'Managing your USDC liquidity and Alpha pool',
  'Building and growing your firm\u2019s brand',
]

const HYPERSCALED_RESPONSIBILITIES = [
  'Trader onboarding infrastructure',
  'Challenge tracking and rule enforcement',
  'Automated payout rails',
  'Infrastructure coordination and deployment',
  'Technical operations and ongoing support',
]

/* ───────────────────────────────────────────────
   Section 1 — Page Hero
   ─────────────────────────────────────────────── */
function PageHero() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-[800px] mx-auto text-center">
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
          style={{ textWrap: 'balance' }}
        >
          Run your own funded trading&nbsp;firm.
          <br />
          <span className="text-zinc-400">
            Powered by Hyperscaled&nbsp;infrastructure.
          </span>
        </h1>

        <p
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          Hyperscaled lets operators launch a fully branded prop trading business without building any infrastructure. You bring traders, set your pricing, and collect revenue. The network handles the challenge, enforcement, and&nbsp;payouts.
        </p>

        <div className="mt-8">
          <a
            href="mailto:partners@hyperscaled.trade"
            className="shiny-cta inline-flex items-center justify-center gap-2 px-6 min-h-12 rounded-lg text-sm font-semibold text-black bg-teal-400 hover:bg-teal-300 transition-[background-color]"
          >
            Apply to Become a Partner
            <ArrowRight size={16} weight="bold" />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 2 — What You Control
   ─────────────────────────────────────────────── */
function WhatYouControlSection() {
  return (
    <section className="px-6 pb-20">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          What You Control
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
          Your firm. Your brand. Your&nbsp;economics.
        </h2>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHAT_YOU_CONTROL.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-400/[0.08] border border-teal-400/20 flex items-center justify-center shrink-0">
                    <Icon size={16} weight="duotone" className="text-teal-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed pl-11">
                  {item.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 3 — Revenue Model
   ─────────────────────────────────────────────── */
function RevenueModelSection() {
  return (
    <section className="px-6 py-20 bg-white/[0.02] border-y border-white/[0.06]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Revenue Model
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
          Two revenue streams. One&nbsp;infrastructure.
        </h2>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Stream 1 */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">
              Trader Registration Fees (USDC)
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Every trader who registers with your firm pays a challenge fee in USDC. That payment routes directly to your designated wallet — not through Hyperscaled. This is your primary business revenue and payout liquidity&nbsp;pool.
            </p>
          </div>

          {/* Revenue Stream 2 */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">
              Network Rewards (Alpha Emissions)
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              When your traders generate profits, Hyperscaled&rsquo;s decentralized funding engine emits Alpha tokens to your firm. Alpha represents your firm&rsquo;s funding capacity on the network. More Alpha means more traders you can fund&nbsp;simultaneously.
            </p>
          </div>
        </div>

        {/* Mental model callout */}
        <div className="mt-10 rounded-xl border border-teal-400/20 bg-teal-400/[0.06] p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="font-mono text-lg sm:text-xl font-bold text-teal-400">USDC</span>
              <p className="mt-1.5 text-sm text-teal-200/80 leading-relaxed">
                Business revenue + payout&nbsp;liquidity
              </p>
            </div>
            <div>
              <span className="font-mono text-lg sm:text-xl font-bold text-teal-400">Alpha</span>
              <p className="mt-1.5 text-sm text-teal-200/80 leading-relaxed">
                Network funding capacity + scaling&nbsp;collateral
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 4 — How It Works
   ─────────────────────────────────────────────── */
function HowItWorksSection() {
  return (
    <section className="px-6 py-20 bg-white/[0.02] border-y border-white/[0.06]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          How It Works
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
          Operational in days, not&nbsp;months.
        </h2>

        <div className="mt-10 space-y-0">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-5">
              {/* Timeline column */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-9 h-9 rounded-full border border-teal-400/30 bg-teal-400/[0.08] flex items-center justify-center text-sm font-mono font-semibold text-teal-400">
                  {i + 1}
                </div>
                {i < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="w-[2px] flex-1 bg-teal-400/20 my-2" />
                )}
              </div>

              {/* Content */}
              <div className={i < HOW_IT_WORKS_STEPS.length - 1 ? 'pb-8' : 'pb-0'}>
                <h3 className="text-base font-semibold text-white mt-1.5">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 5 — Division of Responsibility
   ─────────────────────────────────────────────── */
function ResponsibilitySection() {
  return (
    <section className="px-6 pb-20">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Division of Responsibility
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
          Designed for your&nbsp;success.
        </h2>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operator card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#09090b] p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase mb-5">
              You focus on
            </h3>
            <ul className="space-y-4">
              {OPERATOR_RESPONSIBILITIES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircle size={18} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Hyperscaled card */}
          <div className="rounded-2xl border border-teal-400/20 bg-teal-400/[0.03] p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-teal-400 tracking-wide uppercase mb-5">
              Hyperscaled handles
            </h3>
            <ul className="space-y-4">
              {HYPERSCALED_RESPONSIBILITIES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-200">
                  <CheckCircle size={18} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 7 — Application CTA
   ─────────────────────────────────────────────── */
function ApplicationCTASection() {
  return (
    <section className="px-6 pt-16 pb-24 border-t border-white/[0.06]">
      <div className="max-w-[900px] mx-auto text-center">
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          Ready to launch your&nbsp;firm?
        </h2>
        <p
          className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-[56ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          Applications are reviewed within 48 hours. Approved partners receive full whiteglove onboarding with support from the Hyperscaled&nbsp;team.
        </p>
        <div className="mt-8">
          <a
            href="mailto:partners@hyperscaled.trade"
            className="shiny-cta inline-flex items-center justify-center gap-2 px-6 min-h-12 rounded-lg text-sm font-semibold text-black bg-teal-400 hover:bg-teal-300 transition-[background-color]"
          >
            Apply to Become a Partner
            <ArrowRight size={16} weight="bold" />
          </a>
        </div>

        {/* Trust signals */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {[
            '48-hour application review',
            'Whiteglove onboarding included',
            'No infrastructure buildout required',
            'Revenue starts on day one',
          ].map((signal) => (
            <span key={signal} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <CheckCircle size={14} weight="fill" className="text-teal-400 shrink-0" />
              {signal}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Page Compose
   ─────────────────────────────────────────────── */
export default function PartnersPage() {
  return (
    <>
      <PageHero />
      <WhatYouControlSection />
      <RevenueModelSection />
      <HowItWorksSection />
      <ResponsibilitySection />
      <ApplicationCTASection />
    </>
  )
}
