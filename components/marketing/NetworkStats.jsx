'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useBrand } from '@/lib/brand'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const EMPTY = {
  totalPaidOut: 0,
  totalTraders: 0,
  fundedTraders: 0,
  inChallenge: 0,
  eliminated: 0,
  totalVolume: 0,
}

// Formatters mirror the /leaderboard page so the numbers read identically.
function fmt(n) {
  return (n || 0).toLocaleString('en-US')
}
function fmtUSD(n) {
  return '$' + fmt(n)
}
function fmtCompact(n) {
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(0) + 'B+'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(0) + 'M+'
  return fmtUSD(n)
}

// Live network snapshot for the homepage — same summary data (and dynamic
// client fetch) the /leaderboard page uses, condensed into a single card.
export default function NetworkStats() {
  const brand = useBrand()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const url = brand?.id
      ? `/api/leaderboard?brand_id=${encodeURIComponent(brand.id)}`
      : '/api/leaderboard'
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load (${res.status})`)
        return res.json()
      })
      .then((d) => {
        if (!cancelled) {
          setSummary(d?.summary || EMPTY)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(EMPTY)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [brand?.id])

  const s = summary || EMPTY
  const stats = [
    { label: 'Total Paid Out', value: fmtCompact(s.totalPaidOut || 0), color: 'text-teal-400' },
    { label: 'Traders', value: fmt(s.totalTraders || 0), color: 'text-white' },
    { label: 'Active Funded', value: fmt(s.fundedTraders || 0), color: 'text-blue-400' },
    { label: 'In Challenge', value: fmt(s.inChallenge || 0), color: 'text-amber-400' },
    { label: 'Network Volume', value: fmtCompact(s.totalVolume || 0), color: 'text-white' },
  ]

  return (
    <section ref={ref} className="px-6 pt-4 pb-16 sm:pb-20">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 sm:p-8"
        >
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="h-2 w-2 rounded-full bg-teal-400 shrink-0"
                style={{ boxShadow: '0 0 6px rgba(var(--brand-glow),0.8)' }}
                aria-hidden="true"
              />
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-300">
                Live Network
              </span>
            </div>
            <span className="text-xs text-zinc-600">
              Aggregated across the {brand.name}{' '}network
            </span>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {stats.map((st) => (
              <div
                key={st.label}
                className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-4"
              >
                <div className="mb-1.5 text-xs uppercase tracking-widest text-zinc-500">
                  {st.label}
                </div>
                {loading ? (
                  <div className="skeleton h-6 w-16 rounded" />
                ) : (
                  <div className={`text-xl font-bold tabular-nums tracking-tight ${st.color}`}>
                    {st.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
