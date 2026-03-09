'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ChartLineUp, UsersThree, CurrencyDollar, Scales, Percent } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring },
}

const statData = [
  {
    rawNum: '1',
    prefix: '$',
    suffix: 'B+',
    label: 'Network Volume',
    desc: 'Total trading volume processed across the network',
    icon: ChartLineUp,
    badge: { text: 'Live', pulse: true },
  },
  {
    rawNum: '4200',
    prefix: '',
    suffix: '+',
    label: 'Funded Traders',
    desc: 'Funded traders deployed across all integrated prop firms',
    icon: UsersThree,
    badge: null,
  },
  {
    rawNum: '30',
    prefix: '$',
    suffix: 'M+',
    label: 'Token Value Distributed',
    desc: 'Token equivalent value distributed directly to trader wallets, onchain and verifiable',
    icon: CurrencyDollar,
    badge: null,
  },
  {
    rawNum: '2.5',
    prefix: '$',
    suffix: 'M',
    label: 'Max Account Size',
    desc: 'Top-tier funded capital available through performance scaling',
    icon: Scales,
    badge: { text: 'Scaling Active', pulse: true },
  },
  {
    rawNum: '100',
    prefix: '',
    suffix: '%',
    label: 'Max Profit Split',
    desc: 'Keep every dollar you earn with the best-in-class industry profit split',
    icon: Percent,
    badge: null,
    teal: true,
  },
]

function useCounter(rawNum, active, duration = 1300) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const numeric = parseFloat(rawNum)
    if (isNaN(numeric)) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const val = eased * numeric
      setCount(numeric % 1 !== 0 ? parseFloat(val.toFixed(1)) : Math.floor(val))
      if (progress < 1) requestAnimationFrame(step)
      else setCount(numeric)
    }
    requestAnimationFrame(step)
  }, [active, rawNum, duration])
  return count
}

function StatCard({ stat }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const count = useCounter(stat.rawNum, inView)
  const Icon = stat.icon

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      className="relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 overflow-hidden
        hover:border-white/[0.10] transition-colors group flex flex-col"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'radial-gradient(circle at 20% 20%, rgba(0,198,167,0.06), transparent 60%)' }}
      />

      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.06] flex items-center justify-center">
          <Icon size={16} className="text-zinc-400" />
        </div>
        {stat.badge && (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-800 border border-white/[0.06] text-[10px] text-zinc-400 font-medium">
            {stat.badge.pulse && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-teal" />
            )}
            {stat.badge.text}
          </span>
        )}
      </div>

      {/* Number */}
      <div className={`text-4xl font-bold tracking-tight mb-1 ${stat.teal ? 'text-teal-400' : 'text-white'}`}>
        {stat.prefix}{count}{stat.suffix}
      </div>

      {/* Label */}
      <div className="text-sm font-semibold text-zinc-300 mb-1.5">{stat.label}</div>

      {/* Description */}
      <div className="text-xs text-zinc-500 leading-relaxed mt-auto">{stat.desc}</div>
    </motion.div>
  )
}

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-10"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase">
            Network Stats
          </span>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {statData.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
