'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring },
}

const painPoints = [
  {
    number: '01',
    title: 'KYC and geographic bans lock out most of the\u00a0world.',
    body: 'Many prop firms immediately reject traders in 150+ countries, blocking them from access to\u00a0capital.',
    accentColor: 'text-red-400',
    tagBg: 'bg-red-400/8 border-red-400/20',
    tag: 'Rejected',
  },
  {
    number: '02',
    title: 'You earn 70%. They take 30% for doing\u00a0nothing.',
    body: 'Legacy prop firms keep 10–30% of your profits permanently. No accountability or transparency, they take a cut of every winning trade you\u00a0make.',
    accentColor: 'text-amber-400',
    tagBg: 'bg-amber-400/8 border-amber-400/20',
    tag: 'Up to 30% cut',
  },
  {
    number: '03',
    title: 'Discretionary payouts. They may not even pay\u00a0you.',
    body: 'Centralized prop firms control your earnings under full, centralized discretion — they can delay, dispute, or deny payouts with zero accountability. There\u2019s no guarantee you receive a\u00a0payout.',
    accentColor: 'text-amber-400',
    tagBg: 'bg-amber-400/8 border-amber-400/20',
    tag: 'No guarantees',
  },
]

export default function Problem() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-16"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
            The Problem
          </span>
          <h2 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold max-w-2xl mb-5 text-balance">
            Prop firms take up to 30%.{' '}
            <span className="text-zinc-500">Then ghost you on&nbsp;payouts.</span>
          </h2>
          <p className="text-base text-zinc-400 leading-relaxed max-w-[60ch] [text-wrap:pretty]">
            Legacy funded trading is broken by design. KYC walls, profit extraction, and centralized
            discretion mean profitable traders are systematically&nbsp;underserved.
          </p>
        </motion.div>

        {/* Editorial pain points — no cards, just rows */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="divide-y divide-white/[0.06]"
        >
          {painPoints.map((pt) => (
            <motion.div
              key={pt.number}
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-[4rem_1fr_1fr] gap-3 md:gap-8 py-8 first:pt-0 last:pb-0"
            >
              {/* Number */}
              <div className={`text-sm font-mono ${pt.accentColor} md:pt-1`}>
                {pt.number}
              </div>

              {/* Title + tag */}
              <div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-snug">
                  {pt.title}
                </h3>
                <span className={`inline-flex items-center mt-3 px-2 py-0.5 rounded border text-xs font-semibold ${pt.accentColor} ${pt.tagBg}`}>
                  {pt.tag}
                </span>
              </div>

              {/* Body */}
              <p className="text-sm text-zinc-400 leading-relaxed md:pt-1.5 [text-wrap:pretty]">
                {pt.body}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Callout — left border accent, no card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.5 }}
          className="mt-10 border-l-2 border-teal-400 pl-5 py-1"
        >
          <p className="text-sm font-semibold text-teal-300 leading-relaxed max-w-[65ch]">
            Hyperscaled pays 100% performance of rewards because our decentralized network is aligned with your success. No&nbsp;exceptions.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
