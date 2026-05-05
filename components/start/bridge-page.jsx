'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowSquareOut,
  Lightning,
  ChatsCircle,
  Code,
  GithubLogo,
} from '@phosphor-icons/react'
import { trackEvent } from '@/lib/analytics'
import { usePreservedQueryString, parseUtms, withPreservedQuery } from '@/lib/preserve-query'
import { useBrand, useBrandHref } from '@/lib/brand'
import { CHROME_EXTENSION_URL } from '@/lib/constants'

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

export function BridgePage() {
  const qs = usePreservedQueryString()
  const brand = useBrand()
  const brandHref = useBrandHref()

  const registerHref = withPreservedQuery(brandHref('/register'), qs)
  const homeHref = withPreservedQuery(brandHref('/'), qs)
  const sdkHref = brandHref('/agents#sdk')
  const telegramHref = brand.socials?.telegram || 'https://t.me/hyperscaled_bot'

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

  function handleToolClick(tool) {
    trackEvent('bridge_tool_click', { tool, ...parseUtms(qs) })
  }

  const TOOLS = [
    {
      key: 'chrome_extension',
      icon: Lightning,
      title: 'Chrome Extension',
      tag: 'RECOMMENDED',
      body: 'Live guardrails overlaid on Hyperliquid. See your drawdown, performance target, and trailing limits on every order. Blocks trades that would breach your challenge before they execute.',
      cta: { label: 'Install extension', href: CHROME_EXTENSION_URL, external: true },
    },
    {
      key: 'telegram_bot',
      icon: ChatsCircle,
      title: 'Telegram Bot',
      tag: null,
      body: 'Submit orders directly from Telegram. Good for quick entries and mobile-first traders. No extension required.',
      cta: { label: 'Open Telegram bot', href: telegramHref, external: true },
    },
    {
      key: 'sdk',
      icon: Code,
      title: 'SDK',
      tag: null,
      body: 'Programmatic access for automated trading systems. Connect your algorithmic strategy directly to Hyperliquid with full Vanta guardrails.',
      cta: { label: 'View SDK', href: sdkHref, external: false },
    },
  ]

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
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
            Trading on Hyperliquid: How it Works
          </h1>
          <p
            className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
            style={{ textWrap: 'balance' }}
          >
            You're about to register for Hyperscaled through Vanta, which enables Hyperliquid Native trading. You'll trade live on Hyperliquid with your own wallet. Vanta's infrastructure mirrors your performance to a simulated account and pays rewards in USDC — automatically, monthly, onchain.
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
                <div className="text-xs text-teal-400 tracking-widest uppercase font-semibold mb-3">
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
              const ctaClass =
                'mt-5 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg border border-white/[0.08] bg-zinc-900/80 text-sm font-medium text-zinc-200 hover:text-white hover:border-teal-400/30 transition-[color,border-color] outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

              return (
                <div
                  key={tool.key}
                  className="relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-400/8 border border-teal-400/20 flex items-center justify-center">
                      <Icon size={20} className="text-teal-400" />
                    </div>
                    {tool.tag && (
                      <span className="px-2 py-0.5 rounded-full border border-teal-400/20 bg-teal-400/8 text-xs text-teal-400 font-semibold tracking-wide uppercase">
                        {tool.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold tracking-tight text-white mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed flex-1">{tool.body}</p>
                  {tool.cta.external ? (
                    <a
                      href={tool.cta.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleToolClick(tool.key)}
                      className={ctaClass}
                    >
                      {tool.cta.label}
                      <ArrowSquareOut size={14} weight="bold" />
                    </a>
                  ) : (
                    <Link
                      href={tool.cta.href}
                      onClick={() => handleToolClick(tool.key)}
                      className={ctaClass}
                    >
                      {tool.cta.label}
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <a
              href="https://github.com/taoshidev/hyperscaled_extension"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] hover:border-teal-400/30 hover:bg-teal-400/[0.04] px-4 py-2 text-xs sm:text-sm text-zinc-300 transition-colors"
            >
              <GithubLogo size={16} weight="fill" className="text-teal-400" />
              <span>Fully open source —</span>
              <span className="font-mono text-teal-400">taoshidev/hyperscaled_extension</span>
              <ArrowRight size={13} weight="bold" className="text-zinc-500" />
            </a>
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
            It takes about 2 minutes to register and begin your challenge.
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
    </>
  )
}
