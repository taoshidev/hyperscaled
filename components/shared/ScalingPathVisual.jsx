'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SCALING_MILESTONES } from '@/lib/constants'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const BIG_JUMP_INDICES = new Set([
  SCALING_MILESTONES.indexOf('$750K'),
  SCALING_MILESTONES.indexOf('$1M'),
])

export default function ScalingPathVisual({ highlightFrom }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const highlightIndex = highlightFrom
    ? SCALING_MILESTONES.indexOf(highlightFrom)
    : -1

  return (
    <div ref={ref} className="w-full overflow-x-auto">
      <div className="flex items-end gap-1 sm:gap-1.5 min-w-[540px] px-1 py-6">
        {SCALING_MILESTONES.map((milestone, i) => {
          const isHighlighted = highlightIndex >= 0 && i >= highlightIndex
          const isBigJump = BIG_JUMP_INDICES.has(i)
          const barHeight = 32 + i * 10

          return (
            <motion.div
              key={milestone}
              className="flex flex-col items-center flex-1"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.05 }}
            >
              {/* Bar */}
              <div
                className={`w-full rounded-t-md transition-colors ${
                  isHighlighted
                    ? 'bg-teal-400'
                    : 'bg-white/[0.08]'
                } ${isBigJump ? 'ring-1 ring-teal-400/30' : ''}`}
                style={{ height: barHeight }}
              />

              {/* Connector line */}
              <div
                className={`w-full h-[2px] ${
                  isHighlighted ? 'bg-teal-400' : 'bg-white/[0.06]'
                }`}
              />

              {/* Label */}
              <span
                className={`mt-2 text-xs font-mono whitespace-nowrap ${
                  isHighlighted
                    ? 'text-teal-400 font-semibold'
                    : 'text-zinc-500'
                } ${isBigJump ? 'font-semibold' : ''}`}
              >
                {milestone}
              </span>

              {/* Big jump indicator */}
              {isBigJump && (
                <span className="mt-1 text-xs text-teal-400/60 font-medium">
                  ↑
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
