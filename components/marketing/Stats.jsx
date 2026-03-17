'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { NETWORK_STATS } from '@/lib/constants'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

function parseValue(value) {
  const match = value.match(/^([^0-9]*)([0-9,.]+)(.*)$/)
  if (!match) return { prefix: '', rawNum: '0', suffix: value }
  return {
    prefix: match[1],
    rawNum: match[2].replace(/,/g, ''),
    suffix: match[3],
  }
}

const statData = NETWORK_STATS.map((stat) => {
  const { prefix, rawNum, suffix } = parseValue(stat.value)
  return { rawNum, prefix, suffix, label: stat.label }
})

function useCounter(rawNum, active, duration = 1300) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const numeric = parseFloat(rawNum)
    if (isNaN(numeric)) return
    let start = null
    let frameId
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const val = eased * numeric
      setCount(numeric % 1 !== 0 ? parseFloat(val.toFixed(1)) : Math.floor(val))
      if (progress < 1) frameId = requestAnimationFrame(step)
      else setCount(numeric)
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [active, rawNum, duration])
  return count
}

function StatItem({ stat, isLast }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const count = useCounter(stat.rawNum, inView)

  return (
    <div ref={ref} className={`flex flex-col ${isLast ? '' : 'lg:border-r lg:border-white/[0.08]'}`}>
      <div className="text-3xl lg:text-5xl font-bold tracking-tighter text-white">
        {stat.prefix}{count}{stat.suffix}
      </div>
      <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
    </div>
  )
}

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-16 px-6">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="border-t border-b border-white/[0.06] py-10"
        >
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-0">
            {statData.map((stat, i) => (
              <StatItem key={stat.label} stat={stat} isLast={i === statData.length - 1} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
