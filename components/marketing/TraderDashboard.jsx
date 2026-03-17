'use client'

import { useState } from 'react'
import { X, ArrowSquareOut } from '@phosphor-icons/react'

const OPEN_POSITIONS = [
  ['BTC-PERP', 'LONG', '0.025', '$2,429.61', '$96,412.50', '$97,184.20', '$91,280.00', '+$19.29', '$99,500 / $95,200', '2h ago'],
  ['ETH-PERP', 'LONG', '0.85', '$2,305.88', '$2,684.30', '$2,712.80', '$2,480.00', '+$24.22', '$2,850 / $2,620', '5h ago'],
  ['SOL-PERP', 'SHORT', '12.5', '$1,828.75', '$148.62', '$146.30', '$162.40', '+$29.00', '$138.00 / $153.50', '8h ago'],
  ['DOGE-PERP', 'LONG', '5,000', '$1,243.00', '$0.2518', '$0.2486', '$0.2180', '-$16.00', '$0.2700 / $0.2400', '12h ago'],
]

const PAYOUTS = [
  ['5', 'Feb 14, 2025', '$3,200.00', '0xa1b2c3...f0a1b2'],
  ['4', 'Jan 28, 2025', '$2,850.00', '0xd4e5f6...c3d4e5'],
  ['3', 'Jan 12, 2025', '$2,430.00', '0xf7a8b9...e6f7a8'],
  ['2', 'Dec 30, 2024', '$2,100.00', '0x1a2b3c...f1a2b3'],
  ['1', 'Dec 15, 2024', '$1,900.00', '0x8b9c0d...a8b9c0'],
]

export default function TraderDashboard({ addr, onClose }) {
  const [dashTab, setDashTab] = useState('performance')
  const [tradeTab, setTradeTab] = useState('open')

  if (!addr) return null

  const shortAddr = addr.length > 12 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#09090b]/98 backdrop-blur-xl">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-white/[0.06] shrink-0 bg-[#09090b]/80">
        <div className="flex items-center gap-3">
          <img src="/hyperscaled-logo.svg" alt="Hyperscaled" className="h-6 w-auto" />
          <span className="text-zinc-600">/</span>
          <span className="text-xs font-mono text-zinc-400">{shortAddr}</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.06] flex items-center justify-center hover:bg-zinc-700 transition-colors"
          aria-label="Close"
        >
          <X size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-8">

          {/* KYC banner */}
          <div className="flex items-center justify-between p-4 bg-blue-400/[0.04] border border-blue-400/15 rounded-xl mb-8 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Complete KYC to unlock payouts</div>
                <div className="text-xs text-zinc-500 mt-0.5">Permissionless identity verification — no personal data stored on-chain. Takes ~2 minutes.</div>
              </div>
            </div>
            <a
              href="https://hyperscaled.trade/kyc"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium transition-colors shrink-0"
            >
              Verify Identity <ArrowSquareOut size={12} />
            </a>
          </div>

          {/* Account header */}
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-3">CRYPTO 100K</h2>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-400/10 border border-blue-400/20 text-blue-400">Tier III</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-400/10 border border-teal-400/20 text-teal-400">Evaluation</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/10 border border-amber-400/20 text-amber-400">1.25x Leverage</span>
              </div>
            </div>
            <div className="text-xs font-mono text-zinc-500 bg-zinc-900 border border-white/[0.06] px-3 py-2 rounded-lg">{shortAddr}</div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-white/[0.06] mb-6">
            {['performance', 'payouts'].map((t) => (
              <button
                key={t}
                onClick={() => setDashTab(t)}
                className={`px-5 py-3 text-sm capitalize border-b-2 -mb-px transition-colors ${
                  dashTab === t ? 'text-white border-blue-400' : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Performance tab ── */}
          {dashTab === 'performance' && (
            <>
              {/* Balance cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-zinc-500">Balance</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-teal-400/10 border border-teal-400/20 text-teal-400">+0.16%</span>
                  </div>
                  <div className="text-2xl font-bold tracking-tight">$100,163.38</div>
                </div>
                <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-zinc-500">Profit Target</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-400/10 border border-blue-400/20 text-blue-400">$10,000</span>
                  </div>
                  <div className="text-2xl font-bold tracking-tight">$163.38</div>
                </div>
                <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl p-5">
                  <div className="text-xs text-zinc-500 mb-2">Open PnL</div>
                  <div className="text-2xl font-bold tracking-tight text-teal-400">+$56.51</div>
                </div>
              </div>

              {/* Evaluation Progress */}
              <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl p-6 mb-6">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-5">Evaluation Progress</div>
                <div className="bg-zinc-950/50 border border-white/[0.04] rounded-xl p-5">
                  <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
                    <span className="text-sm text-zinc-400">Account Progress</span>
                    <div className="flex gap-4 text-xs text-zinc-500">
                      <span>Max Leverage: <strong className="text-zinc-300">1.25x</strong></span>
                      <span>Trailing Drawdown: <strong className="text-zinc-300">5% — HWM</strong></span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <div className="flex justify-between text-xs text-zinc-500 mb-1"><span>Profit Target</span><span>10%</span></div>
                      <div className="text-xl font-bold text-teal-400 mb-2">$163.38 <span className="text-sm text-zinc-500 font-normal">/ $10,000</span></div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-1.5 rounded-full bg-teal-400" style={{ width: '1.6%' }} /></div>
                      <div className="text-xs text-zinc-600 mt-1.5">1.6% of target</div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-zinc-500 mb-1"><span>Trailing Drawdown</span><span>HWM: $100,163.38</span></div>
                      <div className="text-xl font-bold mb-2">0.00% <span className="text-sm text-zinc-500 font-normal">/ 5.00%</span></div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-1.5 rounded-full bg-blue-400" style={{ width: '0%' }} /></div>
                      <div className="text-xs text-zinc-600 mt-1.5">$0.00 / $5,008.17 max loss</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Days Remaining</div>
                      <div className="text-xl font-bold mb-2">∞</div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-1.5 rounded-full bg-blue-400 w-full" /></div>
                      <div className="text-xs text-zinc-600 mt-1.5">Unlimited trading period</div>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-1 rounded-full bg-gradient-to-r from-blue-400 to-teal-400" style={{ width: '1.6%' }} />
                  </div>
                </div>
              </div>

              {/* Trades */}
              <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="flex gap-0 border-b border-white/[0.06]">
                  {[['open', 'Open Positions'], ['history', 'Trade History'], ['orders', 'Orders']].map(([t, label]) => (
                    <button
                      key={t}
                      onClick={() => setTradeTab(t)}
                      className={`px-5 py-3.5 text-sm border-b-2 -mb-px transition-colors ${
                        tradeTab === t ? 'text-white border-blue-400' : 'text-zinc-500 border-transparent hover:text-zinc-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {tradeTab === 'open' && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-white/[0.04]">
                          {['Symbol', 'Side', 'Size', 'Position Value', 'Entry', 'Mark', 'Liq. Price', 'uPnL', 'TP / SL', 'Time'].map((h) => (
                            <th key={h} className="text-left text-xs text-zinc-500 font-medium uppercase tracking-widest px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {OPEN_POSITIONS.map((r, i) => (
                          <tr key={i} className="border-b border-white/[0.02]">
                            <td className="px-4 py-3 text-sm font-semibold font-mono">{r[0]}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${
                                r[1] === 'LONG'
                                  ? 'text-teal-400 bg-teal-400/10 border-teal-400/20'
                                  : 'text-red-400 bg-red-400/10 border-red-400/20'
                              }`}>{r[1]}</span>
                            </td>
                            {r.slice(2, 7).map((v, j) => <td key={j} className="px-4 py-3 text-sm text-zinc-300">{v}</td>)}
                            <td className={`px-4 py-3 text-sm font-medium ${r[7].startsWith('+') ? 'text-teal-400' : 'text-red-400'}`}>{r[7]}</td>
                            <td className="px-4 py-3 text-sm text-zinc-400">{r[8]}</td>
                            <td className="px-4 py-3 text-xs text-zinc-600">{r[9]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center gap-3 px-4 py-3 border-t border-white/[0.04] bg-zinc-950/30">
                      <span className="text-xs text-zinc-500">Margin Used</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden max-w-[120px]">
                        <div className="h-1.5 rounded-full bg-blue-400" style={{ width: '6.2%' }} />
                      </div>
                      <span className="text-xs font-medium">6.2% <span className="text-zinc-500 font-normal">of $125,000</span></span>
                    </div>
                  </div>
                )}
                {tradeTab === 'history' && (
                  <div className="px-4 py-10 text-center text-sm text-zinc-500">Trade history will appear here once positions are closed.</div>
                )}
                {tradeTab === 'orders' && (
                  <div className="px-4 py-10 text-center text-sm text-zinc-500">No pending orders.</div>
                )}
              </div>
            </>
          )}

          {/* ── Payouts tab ── */}
          {dashTab === 'payouts' && (
            <>
              {/* Wallet banner */}
              <div className="flex items-center justify-between p-4 bg-blue-400/[0.04] border border-blue-400/15 rounded-xl mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">Payout Wallet</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-400/10 border border-blue-400/20 text-blue-400 font-semibold">BASE</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-teal-400/10 border border-teal-400/20 text-teal-400 font-semibold">USDC</span>
                    </div>
                    <div className="text-sm font-mono text-white">0x4f2E...8c3A91dB72f1</div>
                  </div>
                </div>
                <button className="text-xs text-zinc-400 border border-white/[0.08] bg-zinc-800/60 px-3 py-1.5 rounded-lg hover:bg-zinc-700/60 transition-colors">
                  Copy Address
                </button>
              </div>

              {/* Payout stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  ['Total Paid Out', '$12,480.00', 'Lifetime earnings', 'text-teal-400'],
                  ['Payouts Received', '5', 'All confirmed on Base', null],
                  ['Last Payout', '$3,200.00', 'Feb 14, 2025', null],
                ].map(([l, v, s, cl]) => (
                  <div key={l} className="bg-zinc-900/50 border border-white/[0.06] rounded-xl p-5">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{l}</div>
                    <div className={`text-2xl font-bold tracking-tight mb-1 ${cl || 'text-white'}`}>{v}</div>
                    <div className="text-xs text-zinc-600">{s}</div>
                  </div>
                ))}
              </div>

              {/* Payout history */}
              <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <span className="text-xs text-zinc-500 uppercase tracking-widest">Payout History</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {['#', 'Date', 'Amount', 'Token', 'Network', 'Tx Hash', 'Status'].map((h) => (
                          <th key={h} className="text-left text-xs text-zinc-500 font-medium uppercase tracking-widest px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PAYOUTS.map((r, i) => (
                        <tr key={i} className="border-b border-white/[0.02]">
                          <td className="px-4 py-3 text-xs text-zinc-500">{r[0]}</td>
                          <td className="px-4 py-3 text-sm">{r[1]}</td>
                          <td className="px-4 py-3 text-sm font-medium text-teal-400">{r[2]}</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5 text-sm">
                              <span className="w-4 h-4 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center text-xs font-bold text-blue-400">$</span>
                              USDC
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-400/10 border border-purple-400/20 text-purple-400">Base</span>
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href="https://basescan.org"
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                            >
                              {r[3]} <ArrowSquareOut size={11} />
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded font-medium text-teal-400 bg-teal-400/10 border border-teal-400/20">
                              Confirmed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
