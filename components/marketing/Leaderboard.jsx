'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import { MagnifyingGlass, XCircle } from '@phosphor-icons/react'
import { useBrand } from '@/lib/brand'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const EMPTY_LB = {
  summary: { totalPaidOut: 0, totalTraders: 0, fundedTraders: 0, inChallenge: 0, eliminated: 0, totalVolume: 0 },
  fundedTraders: [],
  challengeTraders: [],
}

// Validator returns -100 as a sentinel when there isn't enough history for a sharpe.
function fmtSharpe(s) { return s == null || s <= -99 ? '--' : s.toFixed(2) }
function fmt(n) { return n.toLocaleString('en-US') }
function fmtUSD(n) { return '$' + fmt(n) }
function fmtCompact(n) {
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(0) + 'B+'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(0) + 'M+'
  return fmtUSD(n)
}

export default function Leaderboard({ initialSearch = '' }) {
  const brand = useBrand()
  const router = useRouter()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [activeTab, setActiveTab] = useState('scaled')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const handleSelectTrader = (addr) => {
    if (addr) router.push('/dashboard?addr=' + encodeURIComponent(addr))
  }

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
          setData(EMPTY_LB)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  const summary = data?.summary || EMPTY_LB.summary
  const funded = data?.fundedTraders || EMPTY_LB.fundedTraders
  const challenge = data?.challengeTraders || EMPTY_LB.challengeTraders

  const networkStats = [
    { label: 'Total Paid Out', value: fmtCompact(summary.totalPaidOut || 0), color: 'text-teal-400' },
    { label: 'Traders', value: fmt(summary.totalTraders || 0), color: 'text-white' },
    { label: 'Active Funded', value: fmt(summary.fundedTraders || 0), color: 'text-blue-400' },
    { label: 'In Challenge', value: fmt(summary.inChallenge || 0), color: 'text-amber-400' },
    { label: 'Eliminated', value: fmt(summary.eliminated || 0), color: 'text-red-400' },
    { label: 'Network Volume', value: fmtCompact(summary.totalVolume || 0), color: 'text-white' },
  ]

  const query = searchQuery.trim().toLowerCase()
  const filteredFunded = useMemo(() =>
    query ? funded.filter((t) => (t.address || t.addr || '').toLowerCase().includes(query)) : funded,
    [funded, query]
  )
  const filteredChallenge = useMemo(() =>
    query ? challenge.filter((t) => (t.address || t.addr || '').toLowerCase().includes(query)) : challenge,
    [challenge, query]
  )
  const hasResults = filteredFunded.length > 0 || filteredChallenge.length > 0

  return (
    <section id="leaderboard" ref={ref} className="pt-12 pb-24 px-6">
      <div className="max-w-[1400px] mx-auto">

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-14 flex justify-center"
        >
          <div className="relative w-full max-w-lg">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by HL address…"
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] font-mono transition-[border-color,box-shadow]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle size={18} weight="fill" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.04 }}
          className="mb-14"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">Leaderboard</span>
          <h2 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold max-w-2xl text-balance">
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
            <span className="text-xs text-zinc-600">Aggregated across the {brand.name} network</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {networkStats.map((s) => (
              <div key={s.label} className="bg-zinc-900/40 border border-white/[0.06] rounded-xl p-4">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5">{s.label}</div>
                <div className={`text-xl font-bold tracking-tight tabular-nums ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* No results */}
        {!loading && query && !hasResults && (
          <div className="mb-8 px-4 py-6 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-center">
            <p className="text-sm text-zinc-400">
              No results for{' '}
              <span className="font-mono text-white">{searchQuery}</span>
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              Show all traders
            </button>
          </div>
        )}

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
            Could not reach live data — try again in a moment.
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
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{brand.name}</span>
              <span className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-xs text-zinc-600">Traders registered directly on {brand.name}</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-white/[0.06] mb-5">
              {[
                ['scaled', `Funded (${filteredFunded.length})`],
                ['challenge', `In Challenge (${filteredChallenge.length})`],
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
            {activeTab === 'scaled' && (
              <div className="bg-zinc-900/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] tabular-nums">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['#', 'Address', 'PnL', 'Funding', 'Sharpe', 'Trades', 'Win%', 'Payouts', 'Since'].map((h) => (
                          <th key={h} className="text-left text-xs text-zinc-500 font-medium uppercase tracking-widest px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFunded.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-sm text-zinc-500">
                            No funded traders yet.
                          </td>
                        </tr>
                      )}
                      {filteredFunded.map((t, i) => (
                        <tr
                          key={i}
                          onClick={() => handleSelectTrader(t.address || t.addr)}
                          className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3 text-xs text-zinc-500">{t.rank || i + 1}</td>
                          <td className="px-4 py-3 text-xs font-mono text-teal-400 group-hover:text-teal-300 transition-colors">{t.address || t.addr}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${(t.pnl || 0) >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                            {(t.pnl || 0) >= 0 ? '+' : ''}{fmtUSD(t.pnl || 0)}
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{fmtUSD(t.funding || 0)}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{fmtSharpe(t.sharpe)}</td>
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
                  <table className="w-full min-w-[750px] tabular-nums">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['Address', 'PnL', 'Progress', 'Sharpe', 'Trades', 'Win%', 'Drawdown', 'Since'].map((h) => (
                          <th key={h} className="text-left text-xs text-zinc-500 font-medium uppercase tracking-widest px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChallenge.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-sm text-zinc-500">
                            No traders in challenge.
                          </td>
                        </tr>
                      )}
                      {filteredChallenge.map((t, i) => {
                        const pct = t.progress != null ? t.progress : Math.max(0, ((t.pnl || 0) / 25000 * 10) * 100)
                        return (
                          <tr
                            key={i}
                            onClick={() => handleSelectTrader(t.address || t.addr)}
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
                            <td className="px-4 py-3 text-sm text-zinc-300">{fmtSharpe(t.sharpe)}</td>
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
