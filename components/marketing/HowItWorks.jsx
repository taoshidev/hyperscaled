'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Buildings, PuzzlePiece, TrendUp, ArrowRight } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

/* ── Right-panel mockups ─────────────────────────────────────── */

function PropFirmMockup() {
  const plans = [
    { name: 'Jolly Green Trading', size: '$25,000', split: '90% Split', highlight: false, logo: '/jolly-green.png' },
    { name: 'Talisman', size: '$50,000', split: '95% Split', highlight: true, logo: '/talisman.svg' },
    { name: 'Zoku', size: '$100,000', split: '100% Split', highlight: false, logo: '/zoku.png' },
  ]
  return (
    <div className="w-full max-w-sm space-y-2.5">
      {plans.map((p) => (
        <div
          key={p.name}
          className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors ${
            p.highlight
              ? 'bg-teal-400/5 border-teal-400/25'
              : 'bg-zinc-800/60 border-white/[0.06]'
          }`}
        >
          <div className="flex items-center gap-2">
            {p.logo && (
              <img src={p.logo} alt="" className="w-6 h-6 rounded-md shrink-0 object-contain" />
            )}
            <div>
              <div className={`text-sm font-semibold ${p.highlight ? 'text-white' : 'text-zinc-300'}`}>
                {p.name}
              </div>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              p.highlight
                ? 'bg-teal-400 text-zinc-950'
                : 'bg-zinc-700 text-zinc-400'
            }`}
          >
            {p.split}
          </span>
        </div>
      ))}
    </div>
  )
}

function ExtensionMockup() {
  const rows = [
    { label: 'Challenge', value: 'Phase 1', valueClass: 'text-white' },
    { label: 'Daily Loss', value: '−$120 / $500', valueClass: 'text-zinc-300' },
    { label: 'Profit Target', value: '92.4%', valueClass: 'text-teal-400' },
  ]
  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-white/[0.08] bg-zinc-900">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-800/80 border-b border-white/[0.06]">
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
        <div className="ml-2 flex-1 h-4 rounded bg-zinc-700/60" />
      </div>
      {/* Status row */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" style={{ boxShadow: '0 0 6px rgba(0,198,167,0.7)' }} />
        <span className="text-sm font-semibold text-white">Hyperscaled Active</span>
      </div>
      {/* Data rows */}
      <div className="px-4 py-3 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">{r.label}</span>
            <span className={`text-xs font-mono font-medium ${r.valueClass}`}>{r.value}</span>
          </div>
        ))}
      </div>
      {/* Store listing card */}
      <div className="mx-3 mb-3 mt-1 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-zinc-800/50 px-3 py-2.5">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/[0.08] overflow-hidden flex items-center justify-center">
            <img src="/hyperscaled-mark.svg" alt="" className="w-7 h-7" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center">
            <PuzzlePiece size={11} weight="regular" className="text-teal-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white leading-tight">Hyperscaled Extension</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Chrome Web Store · 2.1k installs</div>
        </div>
        <span className="text-[10px] font-semibold text-teal-400 whitespace-nowrap flex items-center gap-0.5">
          Add to Chrome <ArrowRight size={10} weight="bold" />
        </span>
      </div>
    </div>
  )
}

function PayoutMockup() {
  const bars = [30, 22, 35, 28, 40, 72, 88]
  return (
    <div className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-zinc-900 overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-zinc-500 tracking-widest uppercase font-mono">Total Payouts</span>
          <span className="text-xs font-semibold text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 rounded-full">
            +6.0% APY
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-4">$150,432.01</div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-16">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all ${i >= 5 ? 'bg-teal-400' : 'bg-zinc-700'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Payout row */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-white/[0.06] bg-zinc-800/40">
        <div className="w-7 h-7 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
          <ArrowRight size={12} className="text-teal-400" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white">Weekly Payout Received</div>
          <div className="text-[10px] text-zinc-500 font-mono">0x71...9A2B · 2 mins ago</div>
        </div>
      </div>
    </div>
  )
}

/* ── Steps data ──────────────────────────────────────────────── */

const steps = [
  {
    number: '01',
    icon: Buildings,
    title: 'Choose a Prop Firm',
    body: 'Select from verified prop firms offering competitive pricing and profit splits. No hidden fees, instant credentials.',
    mockup: <PropFirmMockup />,
  },
  {
    number: '02',
    icon: PuzzlePiece,
    title: 'Install the Chrome Extension',
    body: 'The Hyperscaled extension wraps around Hyperliquid interface, showing real-time funded account progress and risk warnings.',
    mockup: <ExtensionMockup />,
  },
  {
    number: '03',
    icon: TrendUp,
    title: 'Trade & Get Funded',
    body: 'Hit 10% profit targets to scale up to $2.5M. Payouts are automated weekly via smart contract directly to your wallet.',
    mockup: <PayoutMockup />,
  },
]

/* ── Component ───────────────────────────────────────────────── */

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" ref={ref} className="relative py-24 px-6 overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-400/[0.07] blur-[120px]" />
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-14"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
            How It Works
          </span>
          <h2 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold max-w-2xl">
            Trade on Hyperliquid.{' '}
            <span className="text-zinc-500">Get funded by the network.</span>
          </h2>
        </motion.div>

        {/* Step cards */}
        <div className="space-y-5">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: i * 0.12 }}
                className="grid grid-cols-1 md:grid-cols-2 bg-zinc-900/40 border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.10] transition-colors"
              >
                {/* Left — text */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  {/* Step badge */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-lg bg-teal-400/10 border border-teal-400/20 flex items-center justify-center">
                      <Icon size={14} className="text-teal-400" />
                    </div>
                    <span className="text-xs text-teal-400 font-mono tracking-widest uppercase">
                      Step {step.number}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-[46ch]">
                    {step.body}
                  </p>
                </div>

                {/* Right — mockup */}
                <div className="border-t md:border-t-0 md:border-l border-white/[0.06] bg-zinc-950/50 p-8 flex items-center justify-center min-h-[220px]">
                  {step.mockup}
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
