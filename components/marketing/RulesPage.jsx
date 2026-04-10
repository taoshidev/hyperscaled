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
import { EVAL_RULES, FUNDED_RULES, SCALING_PATH } from '@/lib/constants'
import { useBrand, useBrandHref } from '@/lib/brand'

/* ───────────────────────────────────────────────
   TOC sections definition
   ─────────────────────────────────────────────── */
const TOC_SECTIONS = [
  { id: 'challenge', label: 'Challenge' },
  { id: 'pairs', label: 'Available Pairs' },
  { id: 'scaled', label: 'Funded Account' },
  { id: 'scaling', label: 'Scaling' },
  { id: 'disqualification', label: 'Disqualification' },
  { id: 'kyc', label: 'KYC & Payouts' },
  { id: 'protocol', label: 'Protocol' },
]

const AVAILABLE_PAIRS = [
  { base: 'ADA', quote: 'USDC' },
  { base: 'BCH', quote: 'USDC' },
  { base: 'BTC', quote: 'USDC' },
  { base: 'DOGE', quote: 'USDC' },
  { base: 'ETH', quote: 'USDC' },
  { base: 'HYPE', quote: 'USDC' },
  { base: 'LINK', quote: 'USDC' },
  { base: 'LTC', quote: 'USDC' },
  { base: 'SOL', quote: 'USDC' },
  { base: 'TAO', quote: 'USDC' },
  { base: 'XMR', quote: 'USDC' },
  { base: 'XRP', quote: 'USDC' },
  { base: 'ZEC', quote: 'USDC' },
]

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
          {TOC_SECTIONS.map((s) => (
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
            {TOC_SECTIONS.map((s) => (
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
          Every rule is published open-source and enforced automatically by the protocol. What you see here is exactly how {brand.name}&nbsp;operates.
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
          The {brand.name} challenge is one step. Rules are consistent across all account&nbsp;sizes.
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
  return (
    <section id="pairs" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Available Pairs
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
          The following trading pairs are available during both the Challenge and Funded&nbsp;phases.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AVAILABLE_PAIRS.map((pair) => (
            <div
              key={pair.base}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
            >
              <span className="text-sm font-semibold text-zinc-200">{pair.base}</span>
              <span className="text-xs text-zinc-600">/</span>
              <span className="text-sm text-zinc-400">{pair.quote}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          Additional pairs may be added as the network expands. All pairs settle in&nbsp;USDC.
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 3 — Funded Account Rules
   ─────────────────────────────────────────────── */
function FundedRulesSection() {
  return (
    <section id="scaled" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Funded Account Phase
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
          Once you pass the challenge, your scaled account is activated immediately. These rules apply for the duration of your scaled&nbsp;trading.
        </p>

        <RulesTable rules={FUNDED_RULES} />
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 4 — Scaling Rules
   ─────────────────────────────────────────────── */

const DOES_DISQUALIFY = [
  'Breaching the daily loss limit (5% during the challenge / 8% when scaled)',
  'Breaching the EOD trailing loss limit (5% during the challenge / 8% when scaled)',
  'Attempting to manipulate challenge performance (wash trading, coordinated cross-account hedging)',
]

const DOES_NOT_DISQUALIFY = [
  'Trading during news events',
  'Holding positions overnight',
  'Trading any perpetual available on Hyperliquid',
  'Taking time off — there is no minimum trading day requirement',
  'Using algorithmic or automated trading strategies',
  'Any drawdown within the defined limits',
]

function ScalingRulesSection() {
  return (
    <section id="scaling" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Account Scaling
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-10">
          Consistent performance on your scaled account unlocks access to progressively larger account sizes, up to a maximum of $2.5M. Scaling is automatic and based on performance thresholds — no application required, no additional&nbsp;fees.
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
          Tier I through Tier IV accounts ($5K, $10K, $25K, and $50K) can scale up to $100K. Tier V accounts ($100K) can scale up to&nbsp;$2.5M.
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
  return (
    <section id="disqualification" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
          Disqualification
        </span>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
          Not every risk leads to disqualification. Here is what does and does not end your challenge or scaled&nbsp;account.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What DOES cause disqualification */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#09090b] p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-red-400 tracking-wide uppercase mb-5">
              What causes disqualification
            </h3>
            <ul className="space-y-4">
              {DOES_DISQUALIFY.map((item) => (
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
   Section 6 — KYC and Payout Eligibility
   ─────────────────────────────────────────────── */
function KYCSection() {
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
            When your scaled account reaches payout eligibility at the end of a 7-day cycle, you will be prompted to complete a brief identity verification to unlock payouts. Payouts are then sent in USDC directly to your connected wallet. The entire payout flow is automated and verifiable&nbsp;onchain.
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
            All rules are enforced programmatically by the {brand.name} protocol. There is no back office, no discretionary review committee, and no ability to override outcomes. Any rule changes are published publicly before taking&nbsp;effect.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href={brandHref('/register')}
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
        <FundedRulesSection />
        <ScalingRulesSection />
        <DisqualificationSection />
        <KYCSection />
        <ProtocolSection />
      </div>
    </>
  )
}
