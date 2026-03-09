'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { IdentificationCard, ChartLineDown, ClockCountdown, X } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: spring },
}

const painPoints = [
  {
    icon: IdentificationCard,
    title: 'KYC and geographic bans lock out most of the world',
    body: 'Every major prop firm requires passport scans, proof of address, and a compliant bank account. Traders in 150+ countries are rejected outright — no exceptions, no appeals.',
    tag: 'Rejected',
    tagColor: 'text-red-400 bg-red-400/10 border-red-400/20',
    span: 'md:col-span-2',
  },
  {
    icon: ChartLineDown,
    title: 'You earn 70%. They take up to 30% for doing nothing.',
    body: 'Legacy prop firms extract 10–30% of your profits permanently. No accountability, no transparency — they just keep a cut of every winning trade you make, even though its simulated accounts.',
    tag: 'Up to 30% Cut',
    tagColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    span: 'md:col-span-1',
  },
  {
    icon: ClockCountdown,
    title: 'Discretionary payouts. They may not even pay you.',
    body: 'Centralized prop firms control your earnings under full discretion — they can delay, dispute, or deny payouts with zero accountability. No guarantees, no appeals, no transparency.',
    body2: 'Hyperscaled gives 100% payouts because we live trade the best traders. When traders win, the network wins.',
    tag: 'No Guarantee',
    tagColor: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
    span: 'md:col-span-2',
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
          className="mb-12"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
            The Problem
          </span>
          <h2 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold max-w-2xl mb-5">
            Prop firms take up to 30%.{' '}
            <span className="text-zinc-500">Then ghost you on payouts.</span>
          </h2>
          <p className="text-base text-zinc-400 leading-relaxed max-w-[60ch]">
            Legacy funded trading is broken by design. KYC walls, profit extraction, and centralized
            discretion mean profitable traders are systematically underserved.
          </p>
        </motion.div>

        {/* Pain point cards — asymmetric grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {painPoints.map((pt) => {
            const Icon = pt.icon
            return (
              <motion.div
                key={pt.title}
                variants={itemVariants}
                className={`${pt.span} relative bg-zinc-900/40 border border-white/[0.06] rounded-2xl p-6 md:p-8
                  group hover:border-white/[0.10] transition-all overflow-hidden`}
              >
                {/* Subtle glow on hover */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'radial-gradient(circle at 15% 15%, rgba(255,60,60,0.04), transparent 60%)',
                  }}
                />

                <div className="relative">
                  {/* Icon + tag row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/[0.06] flex items-center justify-center">
                      <Icon size={20} className="text-zinc-300" />
                    </div>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${pt.tagColor}`}
                    >
                      <X size={9} weight="bold" />
                      {pt.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white tracking-tight mb-3 leading-snug">
                    {pt.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4">{pt.body}</p>
                  {pt.body2 && (
                    <div className="relative rounded-xl border border-teal-400/25 bg-teal-400/[0.06] px-4 py-3.5 overflow-hidden">
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at 0% 50%, rgba(0,198,167,0.12), transparent 70%)' }}
                      />
                      <div className="relative flex items-start gap-3">
                        <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-teal-400 pulse-teal" />
                        <p className="text-sm font-semibold text-teal-300 leading-relaxed">{pt.body2}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
