'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

// Fallback mock data when API is unavailable
const FALLBACK_LB = {
  summary: {
    totalPaidOut: 30000000,
    totalTraders: 4200,
    fundedTraders: 310,
    inChallenge: 2840,
    eliminated: 1050,
    totalVolume: 1000000000,
  },
  fundedTraders: [
    { address: '0x7a3b...f41d', pnl: 48230, funding: 400000, sharpe: 2.14, trades: 847, winRate: 68, payouts: 12480, since: 'Oct 2024' },
    { address: '0xd4e5...b2c3', pnl: 35120, funding: 200000, sharpe: 1.87, trades: 623, winRate: 64, payouts: 8750, since: 'Nov 2024' },
    { address: '0x9f0a...e8d7', pnl: 28940, funding: 200000, sharpe: 1.95, trades: 512, winRate: 71, payouts: 7200, since: 'Sep 2024' },
    { address: '0x2c3d...a1b0', pnl: 22100, funding: 100000, sharpe: 1.62, trades: 389, winRate: 62, payouts: 5500, since: 'Dec 2024' },
    { address: '0xf8a9...c4d5', pnl: 18750, funding: 100000, sharpe: 1.78, trades: 445, winRate: 66, payouts: 4680, since: 'Nov 2024' },
    { address: '0x5e6f...8a9b', pnl: 15320, funding: 100000, sharpe: 1.54, trades: 298, winRate: 60, payouts: 3800, since: 'Jan 2025' },
    { address: '0xb1c2...f0a1', pnl: 12840, funding: 50000, sharpe: 1.41, trades: 267, winRate: 63, payouts: 3200, since: 'Dec 2024' },
    { address: '0x3d4e...7a8b', pnl: 9620, funding: 50000, sharpe: 1.33, trades: 198, winRate: 58, payouts: 2400, since: 'Jan 2025' },
  ],
  challengeTraders: [
    { address: '0xa0b1...d3e4', pnl: 4180, progress: 16.7, sharpe: 1.12, trades: 142, winRate: 57, drawdown: 0, since: 'Feb 2025' },
    { address: '0x6c7d...9f0a', pnl: 2940, progress: 11.8, sharpe: 0.98, trades: 89, winRate: 55, drawdown: 0, since: 'Feb 2025' },
    { address: '0xe2f3...b5c6', pnl: 1820, progress: 7.3, sharpe: 0.87, trades: 64, winRate: 53, drawdown: 0, since: 'Feb 2025' },
    { address: '0x4a5b...8d9e', pnl: -1240, progress: 0, sharpe: 0.42, trades: 51, winRate: 41, drawdown: 5.0, since: 'Feb 2025' },
  ],
}

function fmt(n) { return n.toLocaleString('en-US') }
function fmtUSD(n) { return '$' + fmt(n) }
function fmtCompact(n) {
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(0) + 'B+'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(0) + 'M+'
  return fmtUSD(n)
}

export default function Leaderboard({ onSelectTrader }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [activeTab, setActiveTab] = useState('funded')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/leaderboard')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load (${res.status})`)
        return res.json()
      })
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setData(FALLBACK_LB)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  const summary = data?.summary || FALLBACK_LB.summary
  const funded = data?.fundedTraders || FALLBACK_LB.fundedTraders
  const challenge = data?.challengeTraders || FALLBACK_LB.challengeTraders

  const networkStats = [
    { label: 'Total Paid Out', value: fmtCompact(summary.totalPaidOut || 0), color: 'text-teal-400' },
    { label: 'Traders', value: fmt(summary.totalTraders || 0) + '+', color: 'text-white' },
    { label: 'Active Funded', value: fmt(summary.fundedTraders || 0), color: 'text-blue-400' },
    { label: 'In Challenge', value: fmt(summary.inChallenge || 0), color: 'text-amber-400' },
    { label: 'Eliminated', value: fmt(summary.eliminated || 0), color: 'text-red-400' },
    { label: 'Network Volume', value: fmtCompact(summary.totalVolume || 0), color: 'text-white' },
  ]

  return (
    <section id="leaderboard" ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-14"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">Leaderboard</span>
          <h2 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold max-w-2xl">
            Top traders on{' '}
            <span className="text-teal-400">the network.</span>
          </h2>
        </motion.div>

        {/* Network Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.08 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Network</span>
            <span className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs text-zinc-600">Aggregated across the Hyperscaled network</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {networkStats.map((s) => (
              <div key={s.label} className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-4">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5">{s.label}</div>
                <div className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16">
            <div className="skeleton h-8 w-48 mx-auto mb-4 rounded-lg" />
            <div className="skeleton h-4 w-32 mx-auto rounded" />
          </div>
        )}

        {/* Error banner */}
        {error && !loading && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-amber-400/10 border border-amber-400/20 text-sm text-amber-400">
            Could not reach live data — showing cached results.
          </div>
        )}

        {/* Trader Table */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.14 }}
          >
            {/* Section label */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Hyperscaled</span>
              <span className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-xs text-zinc-600">Traders registered directly on Hyperscaled</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-white/[0.06] mb-5">
              {[
                ['funded', `Funded (${funded.length})`],
                ['challenge', `In Challenge (${challenge.length})`],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'text-white border-teal-400'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Funded table */}
            {activeTab === 'funded' && (
              <div className="bg-zinc-900/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['#', 'Address', 'PnL', 'Funding', 'Sharpe', 'Trades', 'Win%', 'Payouts', 'Since'].map((h) => (
                          <th key={h} className="text-left text-xs text-zinc-500 font-medium uppercase tracking-widest px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {funded.map((t, i) => (
                        <tr
                          key={i}
                          onClick={() => onSelectTrader?.(t.address || t.addr)}
                          className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3 text-xs text-zinc-500">{t.rank || i + 1}</td>
                          <td className="px-4 py-3 text-xs font-mono text-teal-400 group-hover:text-teal-300 transition-colors">{t.address || t.addr}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${(t.pnl || 0) >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                            {(t.pnl || 0) >= 0 ? '+' : ''}{fmtUSD(t.pnl || 0)}
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{fmtUSD(t.funding || 0)}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{t.sharpe != null ? t.sharpe.toFixed(2) : '--'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{fmt(t.trades || 0)}</td>
                          <td className={`px-4 py-3 text-sm ${(t.winRate || 0) >= 60 ? 'text-teal-400' : 'text-white'}`}>{t.winRate != null ? `${t.winRate}%` : '--'}</td>
                          <td className="px-4 py-3 text-sm text-teal-400">{fmtUSD(t.payouts || 0)}</td>
                          <td className="px-4 py-3 text-xs text-zinc-500">{t.since || t.registered || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Challenge table */}
            {activeTab === 'challenge' && (
              <div className="bg-zinc-900/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['Address', 'PnL', 'Progress', 'Sharpe', 'Trades', 'Win%', 'Drawdown', 'Since'].map((h) => (
                          <th key={h} className="text-left text-xs text-zinc-500 font-medium uppercase tracking-widest px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {challenge.map((t, i) => {
                        const pct = t.progress != null ? t.progress : Math.max(0, ((t.pnl || 0) / 25000 * 10) * 100)
                        return (
                          <tr
                            key={i}
                            onClick={() => onSelectTrader?.(t.address || t.addr)}
                            className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors group"
                          >
                            <td className="px-4 py-3 text-xs font-mono text-amber-400 group-hover:text-amber-300 transition-colors">{t.address || t.addr}</td>
                            <td className={`px-4 py-3 text-sm font-semibold ${(t.pnl || 0) >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                              {(t.pnl || 0) >= 0 ? '+' : ''}{fmtUSD(t.pnl || 0)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                  <div
                                    className={`h-1 rounded-full ${(t.pnl || 0) >= 0 ? 'bg-teal-400' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-zinc-500">{pct.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-300">{t.sharpe != null ? t.sharpe.toFixed(2) : '--'}</td>
                            <td className="px-4 py-3 text-sm text-zinc-300">{fmt(t.trades || 0)}</td>
                            <td className={`px-4 py-3 text-sm ${(t.winRate || 0) >= 60 ? 'text-teal-400' : 'text-white'}`}>{t.winRate != null ? `${t.winRate}%` : '--'}</td>
                            <td className="px-4 py-3 text-sm text-zinc-300">
                              {t.drawdown != null ? `${t.drawdown.toFixed(1)}%` : '0.0%'}
                            </td>
                            <td className="px-4 py-3 text-xs text-zinc-500">{t.since || t.registered || '--'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </section>
  )
}
