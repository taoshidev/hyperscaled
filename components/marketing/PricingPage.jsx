'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  CheckCircle,
  ArrowRight,
  ListChecks,
  Target,
  CalendarCheck,
  Wallet,
  Lightning,
  LinkSimple,
  Star,
} from '@phosphor-icons/react'
import Link from 'next/link'
import ScalingPathVisual from '@/components/shared/ScalingPathVisual'
import { useBrandHref } from '@/lib/brand'
import FAQAccordion from '@/components/shared/FAQAccordion'
import { PRICING_TIERS, PRICING_FAQ } from '@/lib/constants'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const TIER_LABELS = { 'tier-1': 'Tier I', 'tier-2': 'Tier II', 'tier-3': 'Tier III', 'tier-4': 'Tier IV', 'tier-5': 'Tier V' }

/* ── Launch Pricing Banner ── */
function LaunchBanner() {
  return (
    <div className="mt-16 bg-teal-400/10 border-b border-teal-400/20">
      <div className="max-w-[1400px] mx-auto px-6 py-3 text-center">
        <p className="text-sm text-teal-400 font-medium" style={{ textWrap: 'balance' }}>
          Launch Pricing Active — Save up to 50% for a limited&nbsp;time.
        </p>
      </div>
    </div>
  )
}

/* ── Page Hero ── */
function PricingHero() {
  return (
    <section className="pt-16 pb-16 px-6">
      <div className="max-w-[800px] mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
          style={{ textWrap: 'balance' }}
        >
          One fee. One challenge. Keep everything you&nbsp;earn.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[60ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          Take the Hyperscaled Challenge with no hidden rules, fees, or time limit. Rewards distributed&nbsp;monthly.
        </motion.p>
      </div>
    </section>
  )
}

/* ── Single Pricing Card ── */
function PricingCard({ tier, index }) {
  const brandHref = useBrandHref()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const details = [
    { label: 'Profit Target', value: tier.profitTargetAmount },
    { label: 'Max Drawdown', value: `${tier.maxDrawdownAmount} limit` },
    { label: 'Scaling', value: tier.scalingPath },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay: index * 0.1 }}
      className={`relative flex flex-col rounded-2xl p-6 sm:p-8 ${
        tier.popular
          ? 'shiny-border'
          : 'border border-white/[0.08] bg-[#09090b]'
      }`}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-teal-400 text-[#09090b] text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full">
            <Star size={12} weight="fill" />
            Most Popular
          </span>
        </div>
      )}

      {/* Tier label */}
      <div className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mt-2 mb-1">
        {TIER_LABELS[tier.id]}
      </div>

      {/* Tier name */}
      <h3 className="text-lg font-semibold">{tier.name}</h3>

      {/* Pricing */}
      <div className="mt-4 flex items-baseline gap-2">
        <ins className="text-3xl sm:text-4xl font-bold font-mono no-underline text-white">
          ${tier.launchPrice}
        </ins>
        <del className="text-sm text-zinc-600 font-mono">${tier.standardPrice}</del>
        <span className="text-xs text-zinc-500 font-medium">USDC</span>
        <span className="sr-only">
          Launch price {tier.launchPrice} USDC, was {tier.standardPrice} USDC
        </span>
      </div>

      {/* Details */}
      <ul className="mt-6 space-y-3 flex-1">
        {details.map((d) => (
          <li key={d.label} className="flex items-start justify-between gap-4 text-sm">
            <span className="text-zinc-500">{d.label}</span>
            <span className="text-right font-medium font-mono text-zinc-200">{d.value}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={brandHref('/register')}
        className={`mt-8 flex items-center justify-center gap-1.5 min-h-12 rounded-xl text-sm font-semibold transition-colors ${
          tier.popular
            ? 'shiny-cta px-6 py-3'
            : 'bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1]'
        }`}
      >
        {tier.cta}
        <ArrowRight size={14} weight="bold" />
      </Link>
    </motion.div>
  )
}

/* ── Pricing Cards Grid ── */
function PricingCards({ tiers }) {
  return (
    <section className="px-6 pb-20">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-5">
        {tiers.map((tier, i) => (
          <PricingCard key={tier.id} tier={tier} index={i} />
        ))}
      </div>
      <p className="text-center text-sm text-zinc-500 mt-8 max-w-[60ch] mx-auto" style={{ textWrap: 'balance' }}>
        All tiers: 10% profit target · 5% max drawdown · 100% profit split · Monthly payouts · No time&nbsp;limit
      </p>
    </section>
  )
}

/* ── What's Included Feature Grid ── */
const INCLUDED_FEATURES = [
  {
    icon: ListChecks,
    title: 'One-Step Challenge',
    desc: 'All challenges are one phase. No second phase, ever.',
  },
  {
    icon: Target,
    title: 'Consistent Rules',
    desc: '10% profit target, 5% max drawdown, no time limit.',
  },
  {
    icon: CalendarCheck,
    title: 'Monthly Payouts',
    desc: 'Funded traders receive USDC payouts monthly.',
  },
  {
    icon: Wallet,
    title: '100% Profit Split',
    desc: 'Every dollar of profit goes directly to your wallet.',
  },
  {
    icon: Lightning,
    title: 'Trade on Hyperliquid',
    desc: 'Use the platform you already know and love.',
  },
  {
    icon: LinkSimple,
    title: 'Onchain Always',
    desc: 'Every payout is verifiable onchain. No exceptions.',
  },
]

function WhatsIncludedGrid() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} className="px-6 pb-20">
      <div className="max-w-[1100px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-10"
        >
          What&apos;s included
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.08 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {INCLUDED_FEATURES.map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-400/8 border border-teal-400/20 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-teal-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-0.5">{feat.title}</div>
                  <div className="text-sm text-zinc-400">{feat.desc}</div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Challenge Progress Widget Mockup ── */
function EvalProgressWidget() {
  return (
    <div
      className="rounded-xl border border-white/[0.08] bg-zinc-900 overflow-hidden"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" style={{ boxShadow: '0 0 6px rgba(0,198,167,0.7)' }} />
          <span className="text-sm font-semibold text-white">Challenge Progress</span>
        </div>
        <span className="text-xs text-zinc-500 font-mono">$100K Account</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Profit Target */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Profit Target</span>
            <span className="text-xs font-mono text-teal-400">$7,420 / $10,000</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06]">
            <div className="h-2 rounded-full bg-teal-400 w-[74%]" />
          </div>
          <div className="text-right mt-1">
            <span className="text-xs font-mono text-teal-400 font-semibold">74.2%</span>
          </div>
        </div>

        {/* High Water Mark */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <span className="text-xs text-zinc-500">High Water Mark</span>
          <span className="text-sm font-mono font-semibold text-white">$107,420</span>
        </div>

        {/* Max Drawdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Max Drawdown</span>
            <span className="text-xs font-mono text-zinc-300">$1,230 / $5,000</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06]">
            <div
              className="h-2 rounded-full w-[24%]"
              style={{ background: 'linear-gradient(90deg, #2DD4BF, #14B8A6)' }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-zinc-600">Safe</span>
            <span className="text-xs font-mono text-zinc-400">24.6% used</span>
          </div>
        </div>

        {/* Profit Target Completion */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <span className="text-xs text-zinc-500">Profit Target Completion</span>
          <span className="text-lg font-bold font-mono text-teal-400">74.2%</span>
        </div>
      </div>
    </div>
  )
}

/* ── A Model Built for Traders ── */
function ModelSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const bullets = [
    'A scaled account upon challenge completion',
    'Verifiable payouts through onchain technology',
    '100% profit split — you keep your earnings',
    'A system designed for trader success',
  ]

  return (
    <section ref={ref} className="px-6 pb-24">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
            A Model Built for Traders
          </span>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left column — text */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
                Your challenge fee grants access&nbsp;to:
              </h2>
              <ul className="space-y-3 mb-6">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckCircle size={18} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold text-white">
                No hidden rules, opaque processes, or denied&nbsp;payouts.
              </p>
            </div>

            {/* Right column — eval progress widget */}
            <div>
              <EvalProgressWidget />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Scaling Path Section ── */
function ScalingSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="px-6 pb-24">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Start at $25K. Scale to&nbsp;$2.5M.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-[56ch] mx-auto leading-relaxed" style={{ textWrap: 'balance' }}>
            Every scaled trader starts at their selected account size. Consistent performance unlocks the next tier automatically — no additional&nbsp;fees.
          </p>
        </motion.div>
        <ScalingPathVisual />
      </div>
    </section>
  )
}

/* ── Pricing FAQ Mini ── */
function PricingFAQSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="px-6 pb-24">
      <div className="max-w-[700px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="text-2xl font-bold tracking-tight text-center mb-8"
        >
          Common questions
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.08 }}
        >
          <FAQAccordion items={PRICING_FAQ} />
        </motion.div>
      </div>
    </section>
  )
}

/* ── Page Compose ── */
export default function PricingPage({ tiers = PRICING_TIERS }) {
  return (
    <>
      <LaunchBanner />
      <PricingHero />
      <PricingCards tiers={tiers} />
      <WhatsIncludedGrid />
      <ModelSection />
      <ScalingSection />
      <PricingFAQSection />
    </>
  )
}
