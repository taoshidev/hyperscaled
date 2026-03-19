'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CheckCircle, ArrowRight } from '@phosphor-icons/react'
import ScalingPathVisual from '@/components/shared/ScalingPathVisual'
import FAQAccordion from '@/components/shared/FAQAccordion'
import { PRICING_TIERS, PRICING_FAQ } from '@/lib/constants'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const INCLUDED_ITEMS = [
  'One-step evaluation',
  '100% profit split',
  'No time limit',
  'News trading allowed',
  'USDC payouts',
  'Scaling to $2.5M',
  'No KYC to start',
]

/* ── Launch Pricing Banner ── */
function LaunchBanner() {
  return (
    <div className="bg-teal-400/10 border-b border-teal-400/20">
      <div className="max-w-[1400px] mx-auto px-6 py-3 text-center">
        <p className="text-sm text-teal-400 font-medium" style={{ textWrap: 'balance' }}>
          <span className="inline-block w-2 h-2 rounded-full bg-teal-400 mr-2 align-middle" />
          Launch Pricing Active — Save up to 50%. Standard pricing takes effect after the launch window&nbsp;closes.
        </p>
      </div>
    </div>
  )
}

/* ── Page Hero ── */
function PricingHero() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-[800px] mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
          style={{ textWrap: 'balance' }}
        >
          One fee. One evaluation. Keep everything you&nbsp;earn.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[60ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          Pay a one-time USDC registration fee to enter the evaluation. No subscriptions. No monthly charges. No profit cuts&nbsp;— ever.
        </motion.p>
      </div>
    </section>
  )
}

/* ── Single Pricing Card ── */
function PricingCard({ tier, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const details = [
    { label: 'Account Size', value: tier.accountSize },
    { label: 'Profit Target', value: `${tier.profitTarget} (${tier.profitTargetAmount} target)` },
    { label: 'Max Drawdown', value: `${tier.maxDrawdown} (${tier.maxDrawdownAmount} limit)` },
    { label: 'Profit Split', value: tier.profitSplit },
    { label: 'Payout Cycle', value: tier.payoutCycle },
    { label: 'Scaling Path', value: tier.scalingPath },
    { label: 'Time Limit', value: tier.timeLimit },
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
          <span className="inline-block bg-teal-400 text-[#09090b] text-xs font-bold tracking-wide uppercase px-4 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {/* Tier name */}
      <h3 className="text-lg font-semibold mt-2">{tier.name}</h3>

      {/* Pricing */}
      <div className="mt-4 flex items-baseline gap-3">
        <ins className="text-3xl sm:text-4xl font-bold font-mono no-underline">
          ${tier.launchPrice}
        </ins>
        <span className="text-sm text-zinc-500">USDC</span>
        <del className="text-sm text-zinc-600 font-mono">${tier.standardPrice}</del>
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
      <a
        href="https://app.hyperscaled.trade"
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-8 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold transition-colors ${
          tier.popular
            ? 'shiny-cta px-6 py-3'
            : 'bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1]'
        }`}
      >
        <span className="flex items-center gap-1.5">
          {tier.cta}
          {!tier.popular && <ArrowRight size={14} weight="bold" />}
        </span>
      </a>
    </motion.div>
  )
}

/* ── Pricing Cards Grid ── */
function PricingCards() {
  return (
    <section className="px-6 pb-20">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
        {PRICING_TIERS.map((tier, i) => (
          <PricingCard key={tier.id} tier={tier} index={i} />
        ))}
      </div>
    </section>
  )
}

/* ── What's Included ── */
function WhatsIncluded() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} className="px-6 pb-20">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          {INCLUDED_ITEMS.map((item) => (
            <span key={item} className="flex items-center gap-2 text-sm text-zinc-300">
              <CheckCircle size={18} weight="fill" className="text-teal-400 shrink-0" />
              {item}
            </span>
          ))}
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
            Every funded trader starts at their selected account size. Consistent performance unlocks the next tier automatically — no additional&nbsp;fees.
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
export default function PricingPage() {
  return (
    <>
      <LaunchBanner />
      <PricingHero />
      <PricingCards />
      <WhatsIncluded />
      <ScalingSection />
      <PricingFAQSection />
    </>
  )
}
