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
} from '@phosphor-icons/react'
import ScalingPathVisual from '@/components/shared/ScalingPathVisual'

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
          From Hyperliquid trader to funded account — here&rsquo;s exactly how it&nbsp;works.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          No API keys. No custody. No separate platform. Hyperscaled wraps around your existing Hyperliquid workflow and evaluates your performance&nbsp;onchain.
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
function KeyDetails({ rows }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
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
    title: 'Register and Select Your Account Size',
    body: 'Go to app.hyperscaled.trade. Connect your Hyperliquid wallet by signing a cryptographic message — no personal information required. Select your account size: $25K, $50K, or $100K. Pay the one-time USDC registration fee. Your evaluation starts immediately.',
    details: [
      { label: 'Account Sizes', value: '$25K / $50K / $100K' },
      { label: 'Registration Fee', value: 'One-time, paid in USDC' },
      { label: 'KYC Required', value: 'None to start' },
      { label: 'Activation', value: 'Immediate' },
    ],
  },
  {
    number: '02',
    icon: ChartLineUp,
    title: 'Trade on Hyperliquid (Your Normal Workflow)',
    body: 'Open Hyperliquid and trade exactly as you normally would. Hyperscaled reads your fills from Hyperliquid\u2019s public data stream in real time — no API keys, no custody, no permissions required. Your trades are mirrored into a simulated funded account at your selected size. Nothing about your trading workflow changes.',
    details: [
      { label: 'Platform', value: 'Hyperliquid — no change to your workflow' },
      { label: 'Data Access', value: 'Public trade data only — no API keys needed' },
      { label: 'Custody', value: 'None — you never send funds to Hyperscaled' },
      { label: 'Minimum capital to trade', value: '$1,000 in your HL account' },
    ],
  },
  {
    number: '03',
    icon: Target,
    title: 'Track Your Progress',
    body: 'The Hyperscaled dashboard at app.hyperscaled.trade shows your real-time evaluation progress — funded account P&L, current drawdown, profit target completion, and expected payout. Everything updates live as you trade.',
    details: [
      { label: 'Dashboard', value: 'app.hyperscaled.trade' },
      { label: 'Updates', value: 'Real-time' },
      { label: 'Tracked metrics', value: 'P&L, drawdown %, profit target %, expected payout' },
    ],
  },
  {
    number: '04',
    icon: CurrencyDollar,
    title: 'Pass, Get Funded, Get Paid',
    body: 'Hit the 10% profit target while keeping daily drawdown under 5%. Your funded account activates immediately — no review period, no waiting. Once funded, trade in 7-day cycles and receive USDC payouts directly to your wallet at the end of each cycle. Scale your account up to $2.5M by consistently hitting quarterly performance thresholds.',
    details: [
      { label: 'Profit Target', value: '10%' },
      { label: 'Max Drawdown (Evaluation)', value: '5% daily / 5% EOD trailing' },
      { label: 'Max Drawdown (Funded)', value: '8%' },
      { label: 'Payout Cycle', value: 'Every 7 days' },
      { label: 'Profit Split', value: '100% — Hyperscaled takes 0%' },
      { label: 'Max Account Size', value: '$2.5M' },
      { label: 'Funded Account Profit Target', value: 'None' },
      { label: 'Scaling Qualification', value: '5% quarterly return + all-time Sharpe ratio > 1' },
      { label: '25% Bonus Qualification', value: '2% quarterly return + all-time Sharpe ratio > 1' },
    ],
  },
]

function StepCard({ step, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const Icon = step.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay: index * 0.06 }}
      className="rounded-2xl border border-white/[0.08] bg-[#09090b] p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        </div>

        {/* Right — key details */}
        <div className="flex items-start">
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
            Consistently hit quarterly performance targets and your funded account grows automatically — no additional fees, no&nbsp;re-evaluation.
          </p>
        </motion.div>
        <ScalingPathVisual />
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
        {/* Label + headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="text-center mb-10"
        >
          <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
            Why This Is Different
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            Your wallet. Your trades. Your&nbsp;keys.
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
            Every traditional prop firm requires you to trade on their platform, with their simulated liquidity. You hand over control of your execution&nbsp;environment.
          </p>
          <p>
            Hyperscaled works differently. You trade on your own Hyperliquid account, with your own funds, using your own wallet. Hyperscaled only reads your public trade data — it never touches your capital, never executes on your behalf, and never holds custody of&nbsp;anything.
          </p>
          <p>
            Your Hyperliquid account is yours. Hyperscaled evaluates your performance against funded account parameters. When you qualify, the network rewards you in&nbsp;USDC.
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
  'You trade on HL',
  'Hyperscaled reads performance',
  '7-day cycle closes',
  'USDC sent to your wallet',
  'Verifiable onchain',
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
            Automated. Onchain. Every 7&nbsp;days.
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
            Once your funded account is active, payouts are calculated automatically at the end of each 7-day trading cycle based on your realized profits. USDC is sent directly to your connected wallet — no manual request required, no withdrawal fees, no&nbsp;delays.
          </p>
          <p>
            KYC is required only at the point of first payout — a simple cryptographic wallet verification. No passport scans, no bank account&nbsp;details.
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
          <div className="hidden md:flex items-center justify-center gap-0">
            {PAYOUT_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center">
                    <span className="text-sm font-bold font-mono text-teal-400">{i + 1}</span>
                  </div>
                  <span className="mt-3 text-xs text-zinc-400 max-w-[110px] leading-snug">
                    {step}
                  </span>
                </div>
                {i < PAYOUT_STEPS.length - 1 && (
                  <div className="w-10 lg:w-16 h-px bg-white/[0.1] mx-2 lg:mx-3 -mt-6" />
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="flex md:hidden flex-col items-start gap-0 pl-4">
            {PAYOUT_STEPS.map((step, i) => (
              <div key={step} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold font-mono text-teal-400">{i + 1}</span>
                  </div>
                  {i < PAYOUT_STEPS.length - 1 && (
                    <div className="w-px h-8 bg-white/[0.1]" />
                  )}
                </div>
                <span className="text-sm text-zinc-400 pt-2.5">{step}</span>
              </div>
            ))}
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
   Section 5 — Bottom CTA
   ─────────────────────────────────────────────── */
function BottomCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} className="px-6 pb-24">
      <div className="max-w-[600px] mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="text-2xl sm:text-3xl font-bold tracking-tight"
        >
          Ready to&nbsp;start?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.08 }}
          className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed"
          style={{ textWrap: 'balance' }}
        >
          One-step evaluation. No KYC to begin. USDC payouts every 7&nbsp;days.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.16 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <Link
            href="/register"
            className="shiny-cta inline-flex items-center gap-1.5 px-6 py-3"
          >
            Start Your Evaluation
            <ArrowRight size={15} weight="bold" />
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            View Pricing
            <ArrowRight size={13} weight="bold" />
          </Link>
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
      <BottomCTA />
    </>
  )
}
