'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Wallet,
  ChartLineUp,
  Target,
  CurrencyDollar,
  Eye,
  ClockCountdown,
  ShieldCheck,
} from '@phosphor-icons/react'
import ScalingPathVisual from '@/components/shared/ScalingPathVisual'
import PricingPreview from '@/components/marketing/PricingPreview'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

/* ───────────────────────────────────────────────
   Section 1 — Page Hero
   ─────────────────────────────────────────────── */
function PageHero() {
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
          Trade on Hyperliquid. Get funded by the&nbsp;network.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          No API keys. No custody. Just Hyperliquid, your wallet, and your trades — we handle the&nbsp;rest.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.16 }}
          className="mt-8"
        >
          <Link
            href="/register"
            className="shiny-cta inline-flex items-center gap-1.5 px-6 py-3"
          >
            Start Your Evaluation
            <ArrowRight size={15} weight="bold" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Key Details Box (reusable within step cards)
   ─────────────────────────────────────────────── */
function KeyDetails({ rows, inline }) {
  if (inline) {
    return (
      <div className="w-full flex flex-wrap gap-x-6 gap-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">{row.label}:</span>
            <span className="font-medium text-zinc-200">{row.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-start justify-between gap-4 px-4 py-3 text-sm ${
            i !== rows.length - 1 ? 'border-b border-white/[0.06]' : ''
          }`}
        >
          <span className="text-zinc-500 shrink-0">{row.label}</span>
          <span className="text-right font-medium text-zinc-200">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────────────────────────────
   Section 2 — Step-by-Step Flow (4 steps)
   ─────────────────────────────────────────────── */
const STEPS = [
  {
    number: '01',
    icon: Wallet,
    title: 'Register & Choose Your Size',
    body: 'Visit our app, connect your wallet, and pay the one-time fee to immediately begin your\u00a0challenge.',
    cta: true,
    details: [
      { label: 'Account Sizes', value: '$25K / $50K / $100K' },
      { label: 'Challenge', value: 'One-Step' },
      { label: 'KYC Required', value: 'None' },
      { label: 'Activation', value: 'Immediate' },
    ],
  },
  {
    number: '02',
    icon: ChartLineUp,
    title: 'Trade on Hyperliquid',
    body: 'Open Hyperliquid and trade as you normally would. Hyperscaled reads your fills from the public data stream — nothing about your workflow\u00a0changes.',
    details: [
      { label: 'Platform', value: 'Hyperliquid' },
      { label: 'Data Access', value: 'Public data only, no API keys needed' },
      { label: 'Custody', value: 'Your funds always stay with you' },
      { label: 'Minimum Trading Capital', value: '$1,000 in Hyperliquid' },
    ],
  },
  {
    number: '03',
    icon: Target,
    title: 'Track in Real Time',
    body: 'Your dashboard and Hyperscaled Chrome plugin show your live P&L, drawdown, profit target progress, and expected payout. Updates in real time as you\u00a0trade.',
    compact: true,
    details: [
      { label: 'Platform', value: 'Hyperscaled App & Chrome Plugin' },
      { label: 'Updates', value: 'Always in real-time' },
    ],
  },
  {
    number: '04',
    icon: CurrencyDollar,
    title: 'Pass. Get Funded. Get Paid.',
    body: 'Hit the 10% profit target with drawdown under 5% to immediately activate your funded account. Keep 100% of profits with payouts delivered in USDC weekly. Scale to $2.5M with continued\u00a0performance.',
    details: [
      { label: 'Profit Target', value: '10%' },
      { label: 'Max Drawdown (Evaluation)', value: '5% daily / 5% EOD trailing' },
      { label: 'Max Drawdown (Funded)', value: '8% daily / 8% EOD trailing' },
      { label: 'Payout Cycle', value: 'Every 7 days' },
      { label: 'Profit Split', value: '100% — Hyperscaled takes 0%' },
    ],
  },
]

/* Scaling qualification rows — displayed in ScalingSection */
const SCALING_QUALIFICATIONS = [
  { label: 'Scaling Qualification', value: '5% quarterly return + all-time Sharpe ratio > 1' },
  { label: '25% Bonus', value: '2% quarterly return + all-time Sharpe ratio > 1' },
  { label: 'Max Account Size', value: '$2.5M' },
  { label: 'Funded Account Profit Target', value: 'None' },
]

function StepCard({ step, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const Icon = step.icon

  /* Compact layout for Step 03 (few detail rows) */
  if (step.compact) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ ...spring, delay: index * 0.06 }}
        className="rounded-2xl border border-white/[0.08] bg-[#09090b] p-6 sm:py-6 sm:px-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          {/* Left — icon + title + body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                <Icon size={20} weight="fill" className="text-teal-400" />
              </div>
              <span className="text-xs font-mono text-zinc-500 tracking-wider uppercase">
                Step {step.number}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight mb-3">
              {step.title}
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              {step.body}
            </p>
          </div>

          {/* Right — inline details */}
          <div className="lg:w-[400px] shrink-0">
            <KeyDetails rows={step.details} />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay: index * 0.06 }}
      className="rounded-2xl border border-white/[0.08] bg-[#09090b] p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,400px)] gap-8">
        {/* Left — text */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center">
              <Icon size={20} weight="fill" className="text-teal-400" />
            </div>
            <span className="text-xs font-mono text-zinc-500 tracking-wider uppercase">
              Step {step.number}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight mb-4">
            {step.title}
          </h3>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            {step.body}
          </p>
          {step.cta && (
            <Link
              href="/register"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              Get started
              <ArrowRight size={14} weight="bold" />
            </Link>
          )}
        </div>

        {/* Right — key details */}
        <div className="flex items-start w-full">
          <KeyDetails rows={step.details} />
        </div>
      </div>
    </motion.div>
  )
}

function StepByStepFlow() {
  return (
    <section className="px-6 pb-20">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-6">
        {STEPS.map((step, i) => (
          <StepCard key={step.number} step={step} index={i} />
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Scaling Path (below Step 4)
   ─────────────────────────────────────────────── */
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
            Scaling path: $100K to&nbsp;$2.5M
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-[56ch] mx-auto leading-relaxed" style={{ textWrap: 'balance' }}>
            Consistently hit quarterly performance targets and your funded account grows automatically with no additional&nbsp;fees.
          </p>
        </motion.div>
        <ScalingPathVisual />

        {/* Scaling qualifications — moved from Step 04 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.12 }}
          className="mt-8 max-w-[540px] mx-auto"
        >
          <KeyDetails rows={SCALING_QUALIFICATIONS} />
        </motion.div>

        <p className="mt-6 text-xs text-zinc-500 text-center max-w-[72ch] mx-auto leading-relaxed">
          This path applies to Tier III ($100K) accounts. Tier I ($25K) and Tier II ($50K) accounts scale up to $100K maximum, at which point the full scaling path&nbsp;applies.
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 3 — Non-Custodial Explainer
   ─────────────────────────────────────────────── */

const LEGACY_ITEMS = [
  'Trade on their platform',
  'Custodial execution environment',
  'Hidden rule changes possible',
  'Centralized payout discretion',
]

const HYPERSCALED_ITEMS = [
  'Trade on Hyperliquid — your own account',
  'Non-custodial — your keys, your wallet',
  'Rules published onchain, immutable',
  'Automated onchain payouts',
]

function NonCustodialExplainer() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="px-6 pb-24">
      <div className="max-w-[1100px] mx-auto">
        {/* Callout bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-10 border-l-2 border-teal-400 pl-5 py-1"
        >
          <p className="text-sm font-semibold text-teal-300 leading-relaxed max-w-[65ch]">
            <span className="text-teal-400">●</span> Your wallet. Your keys. Hyperscaled only reads your public trade data — it never touches your&nbsp;capital.
          </p>
        </motion.div>

        {/* Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.16 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Legacy */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#09090b] p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-zinc-500 tracking-wide uppercase mb-5">
              Legacy Prop Firm
            </h3>
            <ul className="space-y-4">
              {LEGACY_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                  <XCircle size={20} weight="fill" className="text-red-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Hyperscaled */}
          <div className="rounded-2xl border border-teal-400/20 bg-teal-400/[0.03] p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-teal-400 tracking-wide uppercase mb-5">
              Hyperscaled
            </h3>
            <ul className="space-y-4">
              {HYPERSCALED_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-200">
                  <CheckCircle size={20} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 4 — Payout Mechanics
   ─────────────────────────────────────────────── */

const PAYOUT_STEPS = [
  { label: 'You trade on HL', icon: ChartLineUp, detail: null },
  { label: 'Hyperscaled reads performance', icon: Eye, detail: null },
  { label: '7-day cycle closes', icon: ClockCountdown, detail: null },
  { label: 'USDC sent to wallet', icon: Wallet, detail: '+$2,847.32 USDC' },
  { label: 'Verifiable onchain', icon: ShieldCheck, detail: '0x7a3...f4e2' },
]

function PayoutMechanics() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="px-6 pb-24">
      <div className="max-w-[1100px] mx-auto">
        {/* Label + headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="text-center mb-10"
        >
          <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
            Payout Mechanics
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            Automated. Weekly.&nbsp;Onchain.
          </h2>
        </motion.div>

        {/* Body copy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.08 }}
          className="max-w-[700px] mx-auto mb-14 space-y-4 text-sm sm:text-base text-zinc-400 leading-relaxed"
        >
          <p>
            Funded account payouts are calculated automatically on a weekly basis for your realized profits. USDC is sent directly to your connected wallet, with no delays or&nbsp;discretion.
          </p>
          <p>
            A brief KYC is required only for your first payout — just a simple cryptographic wallet&nbsp;verification.
          </p>
        </motion.div>

        {/* Payout flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.16 }}
          className="mb-12"
        >
          {/* Desktop: horizontal */}
          <div className="hidden md:flex items-start justify-center gap-0">
            {PAYOUT_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.label} className="flex items-start">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center">
                      <Icon size={20} weight="fill" className="text-teal-400" />
                    </div>
                    <span className="mt-3 text-xs text-zinc-400 max-w-[120px] leading-snug">
                      {step.label}
                    </span>
                    {step.detail && (
                      <span className="mt-1 text-xs font-mono text-teal-400/80">
                        {step.detail}
                      </span>
                    )}
                  </div>
                  {i < PAYOUT_STEPS.length - 1 && (
                    <div className="w-10 lg:w-16 h-px bg-white/[0.15] mx-2 lg:mx-3 mt-6" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile: vertical */}
          <div className="flex md:hidden flex-col items-start gap-0 pl-4">
            {PAYOUT_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.label} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                      <Icon size={18} weight="fill" className="text-teal-400" />
                    </div>
                    {i < PAYOUT_STEPS.length - 1 && (
                      <div className="w-px h-8 bg-white/[0.15]" />
                    )}
                  </div>
                  <div className="pt-2">
                    <span className="text-sm text-zinc-400">{step.label}</span>
                    {step.detail && (
                      <span className="block text-xs font-mono text-teal-400/80 mt-0.5">
                        {step.detail}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Callout box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.24 }}
          className="max-w-[700px] mx-auto rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-5 sm:p-6 text-center"
        >
          <p className="text-sm sm:text-base text-teal-400 font-medium leading-relaxed" style={{ textWrap: 'balance' }}>
            100% of profits go to you. Hyperscaled takes 0%, including on scaled accounts up to&nbsp;$2.5M.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Page Compose
   ─────────────────────────────────────────────── */
export default function HowItWorksPage() {
  return (
    <>
      <PageHero />
      <StepByStepFlow />
      <ScalingSection />
      <NonCustodialExplainer />
      <PayoutMechanics />
      <PricingPreview />
    </>
  )
}
