'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Warning,
} from '@phosphor-icons/react'
import RulesTable from '@/components/shared/RulesTable'
import { EVAL_RULES, getFundedRules, SCALING_PATH, BUYING_POWER_BY_SIZE, PER_PAIR_LIMITS, PER_PAIR_OVERRIDES, ASSET_CLASS_LIMITS, PORTFOLIO_LIMITS, FEE_RULES, TRADABLE_PAIRS } from '@/lib/constants'
import { useBrand, useBrandHref } from '@/lib/brand'
import { useWithPreservedQuery } from '@/lib/preserve-query'
import { trackCtaClick } from '@/lib/analytics'

/* ───────────────────────────────────────────────
   TOC sections definition
   ─────────────────────────────────────────────── */
function getTocSections(hasCompliance) {
  return [
    { id: 'challenge', label: 'Challenge' },
    { id: 'pairs', label: 'Available Pairs' },
    { id: 'weight-tracking', label: 'Weight Tracking' },
    { id: 'tracking', label: 'Tracking' },
    { id: 'fees', label: 'Fees' },
    { id: 'scaled', label: hasCompliance ? 'Scaled Account (Simulated)' : 'Funded Account' },
    { id: 'scaling', label: 'Scaling' },
    { id: 'disqualification', label: 'Disqualification' },
    { id: 'best-practices', label: 'Best Practices' },
    { id: 'kyc', label: 'KYC & Payouts' },
    { id: 'protocol', label: 'Protocol' },
  ]
}

const TOC_SECTIONS = getTocSections()

/* ───────────────────────────────────────────────
   Sticky TOC (desktop sidebar + mobile jump bar)
   ─────────────────────────────────────────────── */
function handleTocClick(e, id) {
  e.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth' })
  history.replaceState(null, '', `#${id}`)
}

function TableOfContents({ activeId }) {
  const brand = useBrand()
  const sections = getTocSections(Boolean(brand.compliance))
  const navRef = useRef(null)

  useEffect(() => {
    function check() {
      if (!navRef.current) return
      const footer = document.querySelector('footer')
      if (!footer) return
      const navBottom = navRef.current.getBoundingClientRect().bottom
      const footerTop = footer.getBoundingClientRect().top
      const hide = footerTop <= navBottom + 24
      navRef.current.style.opacity = hide ? '0' : '1'
      navRef.current.style.pointerEvents = hide ? 'none' : 'auto'
    }
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        ref={navRef}
        className="hidden lg:block fixed left-[max(1rem,calc((100vw-900px)/2-180px))] top-[126px] w-[140px] z-40 transition-opacity duration-300"
        aria-label="Page sections"
      >
        <ul className="space-y-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleTocClick(e, s.id)}
                className={`block text-xs py-1.5 transition-colors ${
                  activeId === s.id
                    ? 'text-teal-400 font-medium'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile jump bar */}
      <div className="lg:hidden sticky top-[94px] z-30 bg-[#09090b]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-4 py-2 min-w-max">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => handleTocClick(e, s.id)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  activeId === s.id
                    ? 'bg-teal-400/10 text-teal-400 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ───────────────────────────────────────────────
   Active section tracker hook
   ─────────────────────────────────────────────── */
function useActiveSection() {
  const [activeId, setActiveId] = useState('challenge')

  useEffect(() => {
    const ids = TOC_SECTIONS.map((s) => s.id)
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-110px 0px -60% 0px', threshold: 0 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return activeId
}

/* ───────────────────────────────────────────────
   Section 1 — Page Hero
   ─────────────────────────────────────────────── */
function PageHero() {
  const brand = useBrand()
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-[800px] mx-auto text-center">
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
          style={{ textWrap: 'balance' }}
        >
          Rules and Trading&nbsp;Objectives
        </h1>
        <p
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          {brand.compliance ? (
            <>Every rule is published open-source and enforced automatically by Vanta&apos;s autonomous onchain protocol. What you see here is exactly how the Vanta-powered Challenge&nbsp;operates.</>
          ) : (
            <>Every rule is published open-source and enforced automatically by the protocol. What you see here is exactly how {brand.name}&nbsp;operates.</>
          )}
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 2 — Challenge Rules
   ─────────────────────────────────────────────── */
function EvalRulesSection() {
  const brand = useBrand()
  return (
    <section id="challenge" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Challenge Phase
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
          The {brand.name}{' '}challenge is one step. Rules are consistent across all account&nbsp;sizes.
        </p>

        <RulesTable rules={EVAL_RULES} />

        {/* Breach callout */}
        <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[0.04] p-5 flex items-start gap-3">
          <Warning size={20} weight="fill" className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 leading-relaxed">
            Breaching either drawdown rule results in immediate challenge termination. You may re-register at any&nbsp;time.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 2b — Available Trading Pairs
   ─────────────────────────────────────────────── */
function AvailablePairsSection() {
  const brand = useBrand()
  const totalPairs = TRADABLE_PAIRS.reduce((sum, group) => sum + group.count, 0)
  return (
    <section id="pairs" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Available Pairs
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
          There are <span className="text-white font-medium">{totalPairs} tradable pairs</span> across crypto, commodities, indices, and stocks. Although you can trade any pair on Hyperliquid, only these {totalPairs} predefined pairs are tracked and counted toward your {brand.accountType}{' '}trading&nbsp;performance.
        </p>

        <div className="mt-8 space-y-6">
          {TRADABLE_PAIRS.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs text-zinc-500 tracking-widest uppercase font-medium mb-3">
                {group.category} ({group.count})
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.pairs.map((pair) => (
                  <span
                    key={pair}
                    className="text-xs font-mono text-zinc-300 bg-white/[0.04] border border-white/[0.06] rounded-md px-2.5 py-1.5"
                  >
                    {pair}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Tier matrix table (asset-class rows × A/B/C tiers)
   ─────────────────────────────────────────────── */
function TierMatrix({ caption, labelHeader, rows }) {
  return (
    <div className="mb-6">
      {caption && (
        <p className="mb-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">{caption}</p>
      )}
      {/* Desktop */}
      <div className="hidden md:block rounded-lg border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">{labelHeader}</th>
              <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">Tier A</th>
              <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">Tier B</th>
              <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">Tier C</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={i < rows.length - 1 ? 'border-b border-white/[0.04]' : ''}
              >
                <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{row.label}</td>
                <td className="px-4 py-3 text-zinc-400 font-mono">{row.a}</td>
                <td className="px-4 py-3 text-zinc-400 font-mono">{row.b}</td>
                <td className="px-4 py-3 text-zinc-400 font-mono">{row.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div className="text-white font-medium text-sm mb-2">{row.label}</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Tier A</span>
              <span className="text-zinc-200 font-mono">{row.a}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-zinc-500">Tier B</span>
              <span className="text-zinc-200 font-mono">{row.b}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-zinc-500">Tier C</span>
              <span className="text-zinc-200 font-mono">{row.c}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────
   Section 2c — Weight Tracking & Limits
   ─────────────────────────────────────────────── */
function WeightTrackingSection() {
  const brand = useBrand()
  return (
    <section id="weight-tracking" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Weight Tracking & Limits
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
          {brand.name}{' '}mirrors a trader's Hyperliquid positions by replicating each position's target portfolio weight. HL trades are never blocked or modified — {brand.name}{' '}only adjusts what it copies on its own&nbsp;side.
        </p>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
          {brand.name}{' '}enforces three independent weight limits when tracking. A mirrored position is capped if it would exceed any one of&nbsp;them:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          <li>
            <span className="text-white font-medium">Per-pair limit</span> — max exposure to a single trade pair. When HL exposure is above the limit, the copied position is capped at the limit; subsequent HL changes in that pair are only mirrored once HL exposure crosses back below the&nbsp;limit.
          </li>
          <li>
            <span className="text-white font-medium">Asset-class limit</span> — max combined exposure across all tracked pairs in one asset class (crypto, commodities, indices, stocks).
          </li>
          <li>
            <span className="text-white font-medium">Portfolio limit</span> — max aggregate exposure across all tracked positions. It is deliberately tighter than the sum of the asset-class limits, so you cannot fill every class to its own cap at once. When the portfolio is at the limit, any further increase is clipped to remaining portfolio headroom, or skipped if no headroom exists. Headroom frees up when an existing position is&nbsp;reduced.
          </li>
        </ul>
        <div className="mt-5 rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-4">
          <p className="text-sm text-teal-300">
            All limits are enforced automatically by the platform. HL is the source of truth — {brand.name}{' '}mirrors HL as closely as its limits allow, and resumes tracking as soon as weight exposure re-enters the allowed&nbsp;range.
          </p>
        </div>

        {/* Weight tiers by account size */}
        <h3 className="mt-10 mb-4 text-xs text-zinc-500 tracking-widest uppercase font-medium">
          Weight Tiers by Account Size
        </h3>

        {/* Desktop */}
        <div className="hidden md:block rounded-lg border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">Starting Account Size</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">Challenge Weight Tier</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">{brand.compliance ? 'Scaled Weight Tier' : 'Funded Weight Tier'}</th>
              </tr>
            </thead>
            <tbody>
              {BUYING_POWER_BY_SIZE.map((row, i) => (
                <tr
                  key={row.size}
                  className={i < BUYING_POWER_BY_SIZE.length - 1 ? 'border-b border-white/[0.04]' : ''}
                >
                  <td className="px-4 py-3 text-white font-medium font-mono whitespace-nowrap">{row.size}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono">{row.challenge}</td>
                  <td className="px-4 py-3 text-zinc-400 font-mono">{row.funded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-3">
          {BUYING_POWER_BY_SIZE.map((row) => (
            <div
              key={row.size}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="text-white font-medium font-mono text-sm mb-2">{row.size}</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Challenge tier</span>
                <span className="text-zinc-200 font-mono">{row.challenge}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-zinc-500">{brand.compliance ? 'Scaled tier' : 'Funded tier'}</span>
                <span className="text-zinc-200 font-mono">{row.funded}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Weight limits by tier */}
        <h3 className="mt-10 mb-2 text-xs text-zinc-500 tracking-widest uppercase font-medium">
          Weight Limits by Tier
        </h3>
        <p className="mb-5 text-sm text-zinc-400 leading-relaxed">
          All limits are a percentage of your {brand.name}{' '}account balance and depend on your Weight Tier. A mirrored order must satisfy the per-pair, asset-class, and portfolio limit at the same&nbsp;time.
        </p>

        <TierMatrix
          caption="Per-pair limit"
          labelHeader="Asset Class"
          rows={PER_PAIR_LIMITS.map((r) => ({ label: r.assetClass, a: r.a, b: r.b, c: r.c }))}
        />

        {/* Per-pair overrides note */}
        <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            {PER_PAIR_OVERRIDES.map((o) => (
              <span key={o.pair}>
                <span className="text-white font-medium font-mono">{o.pair}</span> is currently set above its class default, at{' '}
                <span className="font-mono text-zinc-200">{o.a}&nbsp;/&nbsp;{o.b}&nbsp;/&nbsp;{o.c}</span> (A&nbsp;/&nbsp;B&nbsp;/&nbsp;C).{' '}
              </span>
            ))}
            Per-pair limits can be tuned individually, and more per-pair adjustments may&nbsp;follow.
          </p>
        </div>

        <TierMatrix
          caption="Asset-class limit"
          labelHeader="Asset Class"
          rows={ASSET_CLASS_LIMITS.map((r) => ({ label: r.assetClass, a: r.a, b: r.b, c: r.c }))}
        />

        <TierMatrix
          caption="Portfolio limit"
          labelHeader="Scope"
          rows={[{ label: 'All tracked positions', a: PORTFOLIO_LIMITS.a, b: PORTFOLIO_LIMITS.b, c: PORTFOLIO_LIMITS.c }]}
        />
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 2d — Tracking Methodology
   ─────────────────────────────────────────────── */
function TrackingMethodologySection() {
  const brand = useBrand()
  return (
    <section id="tracking" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Tracking Methodology
        </span>

        {/* Order Fills */}
        <h3 className="mt-6 mb-3 text-sm font-semibold text-white">Order Fills</h3>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          {brand.name}{' '}tracks trade executions, not pending orders. Open limit orders do not appear in your {brand.name}{' '}account until they fill on Hyperliquid. Once a fill&nbsp;occurs:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li>
            <span className="text-white font-medium">Market orders</span> — mirrored at a price simulated from Hyperliquid's live L2 orderbook, walking the book to compute the average fill price for the {brand.name}{' '}order size. This reflects realistic execution under current liquidity and may differ from your actual Hyperliquid fill&nbsp;price.
          </li>
          <li>
            <span className="text-white font-medium">Limit orders</span> — mirrored at the original limit price, with zero slippage (subject to change in future&nbsp;versions).
          </li>
        </ul>

        {/* Weight Definition */}
        <h3 className="mt-8 mb-3 text-sm font-semibold text-white">Weight Definition</h3>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          Each position's weight is its <span className="text-white font-medium">notional value</span> (not margin) expressed as a percentage of your total HL account value — including perpetual account equity (margin + unrealized PnL) and available spot&nbsp;balance.
        </p>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
          Weighting by notional ensures {brand.name}{' '}replicates your portfolio-level returns, not just your trading actions. For a given notional, the leverage or margin used on Hyperliquid has no effect on what {brand.name}{' '}mirrors. {brand.name}{' '}places no restrictions on your Hyperliquid trading, including leverage and margin mode choice. Note that higher leverage still increases liquidation risk on Hyperliquid itself. If a position is liquidated on Hyperliquid, it is also closed in your {brand.name}&nbsp;account.
        </p>

        {/* 5-Second Cooldown */}
        <h3 className="mt-8 mb-3 text-sm font-semibold text-white">5-Second Cooldown</h3>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          Your {brand.name}{' '}account mirrors each Hyperliquid fill immediately, subject to a <span className="text-white font-medium">5-second cooldown</span> between consecutive updates. If multiple fills occur within 5 seconds, only the first is mirrored immediately; once the cooldown expires, {brand.name}{' '}reads your latest cumulative HL position and applies a single update reflecting the net result — regardless of how many fills happened in&nbsp;between.
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 2e — Spread, Fees & Slippage
   ─────────────────────────────────────────────── */
function FeesSection() {
  const brand = useBrand()
  return (
    <section id="fees" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Spread, Fees & Slippage
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
          The following costs are applied to your {brand.name}{' '}account, consistent with real trading on&nbsp;Hyperliquid.
        </p>
        <RulesTable rules={FEE_RULES} />
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 3 — Funded Account Rules
   ─────────────────────────────────────────────── */
function remapBitcastFundedRules(rules, brandId) {
  return rules.map((r) => {
    if (r.rule === 'Profit Split') {
      return {
        rule: 'Rewards',
        parameter:
          brandId === 'bitcast'
            ? 'Hyperstack uses a 90/10 performance split: you keep 90% of eligible performance-based rewards. Rewards are independent-contractor compensation based on simulated performance, not a share of real trading profits.'
            : 'Vanta retains 0% of performance-based rewards. Rewards are independent-contractor compensation based on simulated performance — not a profit split.',
      }
    }
    if (r.rule === 'Account Breach Consequence') {
      return {
        ...r,
        parameter: r.parameter.replace(
          'Funded account is closed',
          'Scaled account (simulated) is closed'
        ),
      }
    }
    return r
  })
}

function FundedRulesSection() {
  const brand = useBrand()
  const isBitcast = Boolean(brand.compliance)
  const baseRules = getFundedRules(brand.accountType, brand.name)
  const rules = isBitcast ? remapBitcastFundedRules(baseRules, brand.id) : baseRules
  return (
    <section id="scaled" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          {isBitcast ? 'Scaled Account Phase (Simulated)' : 'Funded Account Phase'}
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
          Once you pass the challenge, your {brand.accountType}{' '}account is activated immediately. These rules apply for the duration of your {brand.accountType}&nbsp;trading.
        </p>

        <RulesTable rules={rules} />
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 4 — Scaling Rules
   ─────────────────────────────────────────────── */

function getDisqualifyRules(accountType) {
  return [
    `Breaching the daily loss limit (5% — applies during the challenge and when ${accountType})`,
    `Breaching the EOD trailing loss limit (5% during the challenge / 8% when ${accountType})`,
    'Attempting to manipulate challenge performance (wash trading, coordinated cross-account hedging)',
    'Martingale and martingale-like strategies (progressively increasing position size after losses)',
    '30 consecutive days of inactivity (no trades placed)',
  ]
}

const DOES_NOT_DISQUALIFY = [
  'Trading during news events',
  'Holding positions overnight',
  'Trading any perpetual available on Hyperliquid — only the 58 predefined pairs are tracked toward your performance',
  'Taking time off — there is no minimum trading frequency, but 30 days of inactivity results in elimination',
  'Using algorithmic or automated trading strategies',
  'Any drawdown within the defined limits',
]

function ScalingRulesSection() {
  const brand = useBrand()
  return (
    <section id="scaling" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Account Scaling
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-10">
          Consistent performance on your {brand.accountType}{' '}account unlocks access to progressively larger account sizes, up to a maximum of $400K. Scaling is automatic and based on performance thresholds — no application required, no additional&nbsp;fees.
        </p>

        {/* Qualifications callout boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Scaling qualification */}
          <div className="rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-teal-400 tracking-wide uppercase mb-4">
              Qualifications for Scaling
            </h3>
            <p className="text-sm text-zinc-400 mb-3">
              To qualify for an account size increase:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2.5 text-sm text-zinc-200">
                <CheckCircle size={16} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                <span><span className="font-mono font-medium">5%</span> quarterly return on current account&nbsp;size</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-200">
                <CheckCircle size={16} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                <span>All-time Sharpe ratio greater than&nbsp;<span className="font-mono font-medium">1</span></span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-zinc-500">
              Scaling occurs at the end of the quarter in which qualifications are&nbsp;met.
            </p>
          </div>

          {/* 25% Bonus qualification */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase mb-4">
              Qualifications for 25% Bonus
            </h3>
            <p className="text-sm text-zinc-400 mb-3">
              Receive a 25% bonus based on realized PnL over the&nbsp;quarter:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2.5 text-sm text-zinc-200">
                <CheckCircle size={16} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                <span><span className="font-mono font-medium">2%</span> quarterly&nbsp;return</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-200">
                <CheckCircle size={16} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                <span>All-time Sharpe ratio greater than&nbsp;<span className="font-mono font-medium">1</span></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Tier note */}
        <p className="text-xs text-zinc-500 leading-relaxed mb-10">
          All accounts ($5K, $10K, $25K, $50K, and $100K) can scale up to&nbsp;$400K.
        </p>

        {/* Scaling path table */}
        <div className="mb-10">
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">
                    From
                  </th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">
                    To
                  </th>
                </tr>
              </thead>
              <tbody>
                {SCALING_PATH.map((step, i) => (
                  <tr
                    key={step.from}
                    className={i < SCALING_PATH.length - 1 ? 'border-b border-white/[0.04]' : ''}
                  >
                    <td className="px-4 py-3 text-white font-medium font-mono whitespace-nowrap">
                      {step.from}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono">
                      {step.to}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {SCALING_PATH.map((step) => (
              <div
                key={step.from}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between"
              >
                <span className="text-white font-medium font-mono text-sm">{step.from}</span>
                <ArrowRight size={14} className="text-zinc-600 shrink-0 mx-3" />
                <span className="text-zinc-400 font-mono text-sm">{step.to}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scaling path visual removed — table is sufficient for this page */}

      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 5 — Disqualification Rules
   ─────────────────────────────────────────────── */
function DisqualificationSection() {
  const brand = useBrand()
  const disqualifyRules = getDisqualifyRules(brand.accountType)
  return (
    <section id="disqualification" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Disqualification
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
          Not every risk leads to disqualification. Here is what does and does not end your challenge or {brand.accountType}&nbsp;account.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What DOES cause disqualification */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#09090b] p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-red-400 tracking-wide uppercase mb-5">
              What causes disqualification
            </h3>
            <ul className="space-y-4">
              {disqualifyRules.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                  <XCircle size={20} weight="fill" className="text-red-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* What does NOT cause disqualification */}
          <div className="rounded-2xl border border-teal-400/20 bg-teal-400/[0.03] p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-teal-400 tracking-wide uppercase mb-5">
              What does not cause disqualification
            </h3>
            <ul className="space-y-4">
              {DOES_NOT_DISQUALIFY.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-200">
                  <CheckCircle size={20} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 5b — Best Practices
   ─────────────────────────────────────────────── */

const BEST_PRACTICES = [
  {
    title: 'Depositing or withdrawing from your HL account while positions are open',
    body: 'Position weights are calculated as a percentage of your total HL account value. Changing this value while positions are open shifts the weight of every open position, which can trigger unintended mirrored trades or produce incorrect position sizes. We recommend flattening or closing all tracked positions before adjusting your HL balance.',
  },
  {
    title: 'Mixing Hyperscaled tracking with unrelated HL trading activity',
    body: 'Hyperscaled only tracks a curated set of liquid perpetuals. Activity outside this set still affects your total HL account value and therefore distorts the weights Hyperscaled sees for tracked pairs. To isolate Hyperscaled from this noise, we strongly recommend using a dedicated wallet or a separate HL subaccount exclusively for Hyperscaled tracking.',
  },
  {
    title: 'High-frequency trading on Hyperliquid',
    body: 'Hyperscaled enforces a 5-second cooldown between updates, and there is inherent latency across HL fill execution, orderbook data updates, and on-chain processing. As a result, HFT-style activity on Hyperliquid is unlikely to be accurately reflected in Hyperscaled. Fills will be consolidated or missed entirely, and your Hyperscaled performance is likely to diverge significantly from your Hyperliquid results.',
  },
]

function BestPracticesSection() {
  const brand = useBrand()
  return (
    <section id="best-practices" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Best Practices
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
          The following behaviors are not blocked or restricted by {brand.name}, but each may significantly degrade your {brand.name}{' '}performance. We strongly recommend avoiding&nbsp;them.
        </p>
        <div className="space-y-4">
          {BEST_PRACTICES.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-5"
            >
              <div className="flex items-start gap-3">
                <Warning size={20} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-300 mb-2">{item.title}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 6 — KYC and Payout Eligibility
   ─────────────────────────────────────────────── */
function KYCSection() {
  const brand = useBrand()
  return (
    <section id="kyc" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          KYC & Payouts
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          KYC & Payout Eligibility
        </h2>
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6 space-y-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
          <p>
            KYC is not required to register, trade, or complete the challenge. It is required only to receive a&nbsp;payout.
          </p>
          <p>
            When your {brand.accountType}{' '}account reaches payout eligibility at the end of a 30-day cycle, you will be prompted to complete a brief identity verification to unlock payouts. Payouts are then sent in USDC directly to your connected wallet. The entire payout flow is automated and verifiable&nbsp;onchain.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 7 — Protocol Transparency + CTA
   ─────────────────────────────────────────────── */
function ProtocolSection() {
  const brand = useBrand()
  const brandHref = useBrandHref()
  const withQS = useWithPreservedQuery()
  return (
    <section id="protocol" className="px-6 pb-24 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Protocol
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Protocol Transparency
        </h2>
        <div className="mt-4 rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-5 sm:p-6">
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            {brand.compliance ? (
              <>All rules are automated and enforced programmatically by Vanta&apos;s autonomous onchain protocol; any rule changes are published publicly before they take effect. There is no back office, no discretionary review committee, and no ability to override&nbsp;outcomes.</>
            ) : (
              <>All rules are enforced programmatically by the {brand.name}{' '}protocol. There is no back office, no discretionary review committee, and no ability to override outcomes. Any rule changes are published publicly before taking&nbsp;effect.</>
            )}
          </p>
        </div>

        <div className="mt-8">
          <Link
            href={withQS(brandHref('/register'))}
            onClick={() => trackCtaClick({ label: 'Start Your Challenge', location: 'rules_bottom' })}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1.5"
          >
            Start Your Challenge
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Page Compose
   ─────────────────────────────────────────────── */
export default function RulesPage() {
  const activeId = useActiveSection()

  return (
    <>
      <PageHero />
      <TableOfContents activeId={activeId} />
      <div data-toc-content>
        <EvalRulesSection />
        <AvailablePairsSection />
        <WeightTrackingSection />
        <TrackingMethodologySection />
        <FeesSection />
        <FundedRulesSection />
        <ScalingRulesSection />
        <DisqualificationSection />
        <BestPracticesSection />
        <KYCSection />
        <ProtocolSection />
      </div>
    </>
  )
}
