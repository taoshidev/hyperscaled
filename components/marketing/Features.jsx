'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  CheckCircle,
  TrendUp,
  CurrencyDollar,
  LinkSimple,
  Lightning,
  FileText,
} from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: spring },
}

const features = [
  {
    icon: CheckCircle,
    title: 'One-Step Evaluation',
    body: 'Trade, perform, and unlock funded capital through a transparent, rules-based evaluation. Hit 10% profit, keep drawdown under 5%. One step — no second phase, no retakes.',
    span: 'md:col-span-7',
    large: true,
    extra: (
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { label: 'Profit Target', val: '10%' },
          { label: 'Max Drawdown', val: '5%' },
          { label: 'Evaluation Phases', val: '1' },
          { label: 'Time Limit', val: 'None' },
        ].map((r) => (
          <div
            key={r.label}
            className="p-3 rounded-xl bg-zinc-800/60 border border-white/[0.06]"
          >
            <div className="text-xs text-zinc-500 mb-1">{r.label}</div>
            <div className="text-lg font-bold tracking-tight text-white">{r.val}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: TrendUp,
    title: 'Grow Your Account',
    body: 'Strong performance unlocks access to more capital, with scaling up to $2.5M.',
    span: 'md:col-span-5',
    large: false,
    extra: (
      <div className="mt-5">
        <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
          <span>$100K → $2.5M</span>
          <span>Scaling path</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-1.5 rounded-full bg-teal-400"
            initial={{ width: 0 }}
            whileInView={{ width: '100%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          {['$100K', '$250K', '$500K', '$1M', '$2.5M'].map((t) => (
            <span key={t} className="text-[10px] text-zinc-600 font-mono">{t}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: CurrencyDollar,
    title: 'USDC In, USDC Out',
    body: 'Pay and get paid in USDC. Payouts go directly to your wallet with no withdrawal fees.',
    span: 'md:col-span-5',
    large: false,
    extra: (
      <div className="mt-4 p-3 rounded-xl bg-teal-400/5 border border-teal-400/10 font-mono text-xs">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Payout → your wallet</span>
          <span className="text-teal-400">+$1,271.23 USDC</span>
        </div>
        <div className="text-zinc-600 text-[10px] mt-1">0x4a5b...8d9e · onchain · 2 days ago</div>
      </div>
    ),
  },
  {
    icon: LinkSimple,
    title: 'Onchain Transparency',
    body: 'Every payout is tracked onchain, powered by decentralized infrastructure. No exceptions. No black boxes. Every rule, every reward — fully auditable.',
    span: 'md:col-span-7',
    large: false,
    extra: (
      <div className="mt-5 flex gap-3">
        {['Open-Source', 'Auditable', 'Decentralized'].map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-full border border-teal-400/20 bg-teal-400/5 text-[10px] text-teal-400 font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: Lightning,
    title: 'Trade on Hyperliquid',
    body: 'Use the platform you know and love. You bring the skill, we bring the funding. No new platform to learn.',
    span: 'md:col-span-6',
    large: false,
  },
  {
    icon: FileText,
    title: 'Transparent Rules',
    body: 'All evaluation rules are clear and open-source. Nothing hidden or opaque.',
    span: 'md:col-span-6',
    large: false,
    extra: (
      <div className="mt-4 flex flex-col gap-1.5">
        {['Rules published onchain', 'No hidden clauses', 'Dispute resolution: automated'].map((r) => (
          <div key={r} className="flex items-center gap-2 text-xs text-zinc-400">
            <CheckCircle size={13} className="text-teal-400 shrink-0" />
            {r}
          </div>
        ))}
      </div>
    ),
  },
]

export default function Features() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-12"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
            Features
          </span>
          <h2 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold max-w-xl text-balance">
            Built for traders who trade with an edge.
          </h2>
        </motion.div>

        {/* Bento grid — 12-col */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-12 gap-4"
        >
          {features.map((feat) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                variants={cardVariants}
                className={`${feat.span} relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 overflow-hidden
                  group hover:border-teal-400/20 transition-all duration-300`}
              >
                {/* Inner glow */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'radial-gradient(circle at 15% 15%, rgba(0,198,167,0.07), transparent 60%)',
                  }}
                />

                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-teal-400/8 border border-teal-400/20 flex items-center justify-center mb-4 group-hover:bg-teal-400/15 transition-colors">
                    <Icon size={20} className="text-teal-400" />
                  </div>
                  <h3
                    className={`font-bold tracking-tight text-white mb-2 ${
                      feat.large ? 'text-xl md:text-2xl' : 'text-base md:text-lg'
                    }`}
                  >
                    {feat.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed [text-wrap:pretty]">{feat.body}</p>
                  {feat.extra}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
