'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowLeft,
  Lightning,
  ChatsCircle,
  Code,
  CheckCircle,
} from '@phosphor-icons/react'
import { trackEvent } from '@/lib/analytics'
import { usePreservedQueryString, parseUtms, withPreservedQuery } from '@/lib/preserve-query'

const VANTA_SITE = 'https://vantatrading.io'

const STEPS = [
  {
    eyebrow: 'STEP 01',
    title: 'Register & choose your size',
    body: 'Choose your account size from $5K to $100K. Pay a one-time fee in USDC. No recurring charges, no subscriptions.',
  },
  {
    eyebrow: 'STEP 02',
    title: 'Trade on Hyperliquid',
    body: 'Connect your Hyperliquid wallet and trade exactly how you trade today — same interface, same order book, same fills. Your funds never leave your wallet.',
  },
  {
    eyebrow: 'STEP 03',
    title: 'Hit the target, get paid',
    body: 'Hit the 10% performance target with drawdown under 5% and your scaled account activates immediately. Rewards are paid monthly in USDC, onchain. You keep 100%.',
  },
]

const TOOLS = [
  {
    icon: Lightning,
    title: 'Chrome Extension',
    tag: 'RECOMMENDED',
    body: 'Live guardrails overlaid on Hyperliquid. See your drawdown, performance target, and trailing limits on every order. Blocks trades that would breach your challenge before they execute.',
    footer: 'Open-source · taoshidev/hyperscaled_extension',
  },
  {
    icon: ChatsCircle,
    title: 'Telegram Bot',
    tag: null,
    body: 'Submit orders directly from Telegram. Good for quick entries and mobile-first traders. No extension required.',
    footer: null,
  },
  {
    icon: Code,
    title: 'SDK',
    tag: null,
    body: 'Programmatic access for automated trading systems. Connect your algorithmic strategy directly to Hyperliquid with full Vanta guardrails.',
    footer: null,
  },
]

const REASSURANCE = [
  { title: 'Non-custodial', body: 'your wallet, your keys' },
  { title: '100% performance rewards', body: 'we take 0%' },
  { title: 'No KYC to start', body: 'brief verification before first payout' },
  { title: 'Fully open-source', body: 'every component is auditable' },
]

export function BridgePage() {
  const qs = usePreservedQueryString()

  // Pre-compute outbound links. Empty qs falls through harmlessly.
  const registerHref = withPreservedQuery('/register', qs)
  const vantaHref = withPreservedQuery(VANTA_SITE, qs)
  const homeHref = withPreservedQuery('/', qs)

  // bridge_page_view — once on mount, with UTMs if present.
  useEffect(() => {
    trackEvent('bridge_page_view', parseUtms(qs))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once
  }, [])

  // bridge_tool_card_view — fire once when the tools section scrolls in.
  const toolsRef = useRef(null)
  const toolsFiredRef = useRef(false)
  useEffect(() => {
    const el = toolsRef.current
    if (!el || toolsFiredRef.current) return
    if (typeof IntersectionObserver === 'undefined') return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !toolsFiredRef.current) {
            toolsFiredRef.current = true
            trackEvent('bridge_tool_card_view', parseUtms(qs))
            obs.disconnect()
            break
          }
        }
      },
      { threshold: 0.35 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [qs])

  function handleContinueClick(location) {
    trackEvent('bridge_continue_click', { cta_location: location, ...parseUtms(qs) })
  }

  function handleLearnMoreClick() {
    trackEvent('bridge_learn_more_click', parseUtms(qs))
  }

  function handleExitClick(location) {
    trackEvent('bridge_exit_click', { exit_location: location, ...parseUtms(qs) })
  }

  return (
    <main className="min-h-[100dvh] flex flex-col">
      {/* Minimal nav */}
      <nav className="flex items-center justify-between py-4 px-6 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-6">
          <Link
            href={vantaHref}
            onClick={() => handleExitClick('back')}
            className="outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
            aria-label="Back to Vanta Trading"
          >
            <img src="/vanta-logo.svg" alt="Vanta Trading" className="h-7 w-auto" />
          </Link>
          <Link
            href={vantaHref}
            onClick={() => handleExitClick('back')}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={14} weight="bold" />
            Back to Vanta Trading
          </Link>
        </div>
        <Link
          href={vantaHref}
          onClick={() => handleExitClick('exit')}
          className="inline-flex items-center justify-center h-11 px-4 rounded-md border border-white/10 text-sm text-zinc-400 hover:text-zinc-100 hover:border-white/20 transition-[color,border-color] outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Exit
        </Link>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-20 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-400/20 bg-teal-400/8 text-xs text-teal-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-teal" />
              Powered by Hyperscaled
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
            style={{ textWrap: 'balance' }}
          >
            Here's how Hyperscaled works
          </h1>
          <p
            className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
            style={{ textWrap: 'balance' }}
          >
            You're about to register for a scaled trading account on Hyperliquid. Before you do, here's the quick version: you'll trade live on Hyperliquid with your own wallet. Vanta's infrastructure mirrors your performance to a simulated scaled account and pays rewards in USDC — automatically, monthly, onchain.
          </p>
          <div className="mt-8">
            <Link
              href={registerHref}
              onClick={() => handleContinueClick('hero')}
              className="shiny-cta inline-flex items-center gap-1.5 px-6 py-3 min-h-12"
            >
              Continue to Registration
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3-step flow */}
      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-10 text-center sm:text-left">
            <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-3">
              How It Works
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Three steps. That's the whole flow.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.eyebrow}
                className="relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6"
              >
                <div className="text-[11px] sm:text-xs text-teal-400 tracking-widest uppercase font-semibold mb-3">
                  {step.eyebrow}
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section ref={toolsRef} className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-10 text-center sm:text-left">
            <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-3">
              Tools
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1] mb-3"
              style={{ textWrap: 'balance' }}
            >
              Three ways to manage your challenge
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-[62ch] sm:mx-0 mx-auto">
              Pick whichever fits your workflow. All optional — your trades happen on Hyperliquid either way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TOOLS.map((tool) => {
              const Icon = tool.icon
              return (
                <div
                  key={tool.title}
                  className="relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-400/8 border border-teal-400/20 flex items-center justify-center">
                      <Icon size={20} className="text-teal-400" />
                    </div>
                    {tool.tag && (
                      <span className="px-2 py-0.5 rounded-full border border-teal-400/20 bg-teal-400/8 text-[11px] text-teal-400 font-semibold tracking-wide uppercase">
                        {tool.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold tracking-tight text-white mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed flex-1">{tool.body}</p>
                  {tool.footer && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-zinc-500 font-mono">
                      {tool.footer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500">
            You can use any combination — or none at all. Your trades happen on Hyperliquid regardless.
          </p>
        </div>
      </section>

      {/* Reassurance row */}
      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-5">
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
              {REASSURANCE.map((item) => (
                <li key={item.title} className="flex items-start gap-2 text-xs">
                  <CheckCircle size={14} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-400">
                    <span className="text-zinc-200 font-semibold">{item.title}</span>
                    <span className="text-zinc-500"> — {item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-[640px] mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]"
            style={{ textWrap: 'balance' }}
          >
            Ready when you are.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Takes about 2 minutes to register and begin your challenge.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              href={registerHref}
              onClick={() => handleContinueClick('footer')}
              className="shiny-cta inline-flex items-center gap-1.5 px-6 py-3 min-h-12"
            >
              Continue to Registration
              <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href={homeHref}
              onClick={handleLearnMoreClick}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
            >
              Or learn more about Hyperscaled
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
