'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  Envelope,
  Wallet,
  CurrencyDollar,
  Target,
  CheckCircle,
  Warning,
  CaretRight,
  ArrowSquareOut,
  CreditCard,
  Gear,
  ChartLineUp,
  Coin,
  Timer,
  TrendDown,
  PuzzlePiece,
  Eye,
  HandCoins,
} from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

/* ───────────────────────────────────────────────
   TOC sections definition
   ─────────────────────────────────────────────── */
const TOC_SECTIONS = [
  { id: 'registration', label: 'Registration' },
  { id: 'payment-methods', label: 'Payment Methods' },
  { id: 'challenge-rules', label: 'Challenge Rules' },
  { id: 'after-registration', label: 'After Registration' },
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
        className="hidden lg:block fixed left-[max(1rem,calc((100vw-900px)/2-200px))] top-[126px] w-[160px] z-40 transition-opacity duration-300"
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
  const [activeId, setActiveId] = useState('registration')

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
   Reusable building blocks
   ─────────────────────────────────────────────── */
function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={spring}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SectionLabel({ children }) {
  return (
    <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">
      {children}
    </span>
  )
}

function TipBox({ label, children }) {
  return (
    <div className="rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-5 sm:p-6">
      {label && (
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} weight="fill" className="text-teal-400 shrink-0" />
          <h4 className="text-sm font-semibold text-teal-400 uppercase tracking-wide">
            {label}
          </h4>
        </div>
      )}
      <div className="text-sm text-zinc-400 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )
}

function WarnBox({ label, children }) {
  return (
    <div className="rounded-xl border border-[oklch(0.6_0.16_60/30%)] bg-[oklch(0.6_0.16_60/6%)] p-5 sm:p-6">
      {label && (
        <div className="flex items-center gap-2 mb-3">
          <Warning size={16} weight="fill" className="text-amber-400 shrink-0" />
          <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
            {label}
          </h4>
        </div>
      )}
      <div className="text-sm text-zinc-400 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
          <Icon size={18} weight="fill" className="text-teal-400" />
        </div>
        <h3 className="text-base font-semibold text-zinc-200">{title}</h3>
      </div>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  )
}

function NumberedStep({ number, children }) {
  return (
    <li className="flex items-start gap-3 text-sm text-zinc-400 leading-relaxed">
      <span className="flex items-center justify-center min-w-6 h-6 rounded-full bg-[oklch(0.2_0_0)] border border-white/[0.1] text-teal-400 text-xs font-bold shrink-0 mt-0.5">
        {number}
      </span>
      <span>{children}</span>
    </li>
  )
}

/* ───────────────────────────────────────────────
   Section 1 — Page Hero
   ─────────────────────────────────────────────── */
function PageHero() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-[800px] mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
          style={{ textWrap: 'balance' }}
        >
          Getting Started with&nbsp;Hyperscaled
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          Hyperscaled is a decentralized prop trading network built on Hyperliquid.
          Register, trade on Hyperliquid, pass the one-step challenge, and receive
          100% of your profits in monthly USDC&nbsp;payouts.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.14 }}
          className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-[56ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          This guide covers everything you need to know: registration, payment,
          challenge rules, and what happens after you&nbsp;pass.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
          className="mt-8"
        >
          <Link
            href="/prod-register"
            className="shiny-cta inline-flex items-center gap-1.5 px-6 py-3 min-h-12"
          >
            <span className="flex items-center gap-1.5">
              Start Your Challenge
              <ArrowRight size={15} weight="bold" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 2 — Registration
   ─────────────────────────────────────────────── */
function RegistrationSection() {
  return (
    <section id="registration" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <AnimatedSection>
          <SectionLabel>Step 1</SectionLabel>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Registration
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-10">
            Registration takes about two minutes. You will provide an email address,
            your Hyperliquid wallet address, choose a plan, set a payout wallet, and
            pay the one-time challenge&nbsp;fee.
          </p>
        </AnimatedSection>

        <div className="flex flex-col gap-6">
          {/* Email */}
          <AnimatedSection>
            <InfoCard icon={Envelope} title="Email Address">
              <p>
                Enter the email address you want associated with your Hyperscaled
                account. This is separate from your Hyperliquid login and is used for:
              </p>
              <ul className="space-y-2 pl-1">
                <li className="flex items-start gap-2.5">
                  <CaretRight size={14} weight="bold" className="text-teal-400 shrink-0 mt-1" />
                  <span>Registration confirmation</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CaretRight size={14} weight="bold" className="text-teal-400 shrink-0 mt-1" />
                  <span>Trade mirroring notifications</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CaretRight size={14} weight="bold" className="text-teal-400 shrink-0 mt-1" />
                  <span>Drawdown and performance alerts</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CaretRight size={14} weight="bold" className="text-teal-400 shrink-0 mt-1" />
                  <span>Payout notifications when you pass the challenge</span>
                </li>
              </ul>
              <p className="text-zinc-500">
                Use an email you check regularly. Drawdown alerts are time-sensitive
                and can help you manage&nbsp;risk.
              </p>
            </InfoCard>
          </AnimatedSection>

          {/* Hyperliquid Wallet */}
          <AnimatedSection>
            <InfoCard icon={Wallet} title="Hyperliquid Wallet Address">
              <p>
                This is the wallet address you trade from on Hyperliquid. It starts
                with <code className="font-mono text-xs bg-[oklch(0.2_0_0)] border border-white/[0.1] rounded px-1.5 py-px text-teal-400">0x</code>.
                Hyperscaled monitors this address on-chain and mirrors every trade
                proportionally to your Hyperscaled&nbsp;account.
              </p>

              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-300 mb-3">
                  How to find your address
                </h4>
                <ol className="space-y-2 list-none p-0">
                  <NumberedStep number={1}>
                    Go to{' '}
                    <a
                      href="https://app.hyperliquid.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      app.hyperliquid.xyz
                      <ArrowSquareOut size={12} weight="bold" />
                    </a>
                  </NumberedStep>
                  <NumberedStep number={2}>
                    Connect your wallet or log in if already connected
                  </NumberedStep>
                  <NumberedStep number={3}>
                    Your address appears in the <strong className="text-zinc-200 font-semibold">top-right corner</strong> of the page
                  </NumberedStep>
                  <NumberedStep number={4}>
                    Click it to copy, then paste it into the registration form
                  </NumberedStep>
                </ol>
              </div>
            </InfoCard>

            <div className="mt-4">
              <WarnBox label="Subaccount vs. main wallet">
                <p>
                  You can register a subaccount address for trade mirroring, but{' '}
                  <strong className="text-zinc-200 font-semibold">
                    payment must come from your main Hyperliquid wallet
                  </strong>. Hyperliquid only allows sending funds from the main account,
                  not from subaccounts.
                </p>
              </WarnBox>
            </div>
          </AnimatedSection>

          {/* Choosing a Plan */}
          <AnimatedSection>
            <InfoCard icon={Target} title="Choosing a Plan">
              <p>
                Hyperscaled offers three account tiers. All three share the same
                challenge rules: 10% profit target, 5% max drawdown, no time limit.
                The difference is the starting account size and maximum scaling&nbsp;path.
              </p>

              <div className="mt-4 rounded-lg border border-white/[0.06] overflow-hidden">
                <div className="bg-white/[0.02] border-b border-white/[0.06]">
                  <div className="grid grid-cols-4 gap-0 text-xs text-zinc-500 uppercase tracking-widest font-medium">
                    <div className="px-4 py-3">Tier</div>
                    <div className="px-4 py-3 text-right">Size</div>
                    <div className="px-4 py-3 text-right">Fee</div>
                    <div className="px-4 py-3 text-right">Max Scale</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-0 text-sm border-b border-white/[0.04]">
                  <div className="px-4 py-3 text-zinc-300 font-medium">Tier I</div>
                  <div className="px-4 py-3 text-right text-zinc-200 font-mono">$25K</div>
                  <div className="px-4 py-3 text-right text-zinc-200 font-mono">$149</div>
                  <div className="px-4 py-3 text-right text-zinc-400 font-mono">$100K</div>
                </div>
                <div className="grid grid-cols-4 gap-0 text-sm border-b border-white/[0.04]">
                  <div className="px-4 py-3 text-zinc-300 font-medium">Tier II</div>
                  <div className="px-4 py-3 text-right text-zinc-200 font-mono">$50K</div>
                  <div className="px-4 py-3 text-right text-zinc-200 font-mono">$249</div>
                  <div className="px-4 py-3 text-right text-zinc-400 font-mono">$100K</div>
                </div>
                <div className="grid grid-cols-4 gap-0 text-sm">
                  <div className="px-4 py-3 text-zinc-300 font-medium flex items-center gap-1.5">
                    Tier III
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400 border border-teal-400/30 bg-teal-400/10 rounded px-1.5 py-px leading-none">
                      Popular
                    </span>
                  </div>
                  <div className="px-4 py-3 text-right text-zinc-200 font-mono">$100K</div>
                  <div className="px-4 py-3 text-right text-zinc-200 font-mono">$449</div>
                  <div className="px-4 py-3 text-right text-teal-400 font-mono">$2.5M</div>
                </div>
              </div>

              <p className="text-zinc-500 text-xs mt-3">
                Prices shown are current launch pricing. All fees are one-time and non-refundable.
              </p>
            </InfoCard>
          </AnimatedSection>

          {/* Payout Wallet */}
          <AnimatedSection>
            <InfoCard icon={HandCoins} title="Payout Wallet">
              <p>
                This is the wallet address where your profits will be sent. Payouts are
                processed automatically at the end of each monthly cycle and delivered
                in USDC directly to this wallet, with no manual withdrawal&nbsp;needed.
              </p>
              <p>
                By default, the payout wallet is prefilled with your Hyperliquid
                trading address. You can change it to any Ethereum-compatible
                address: a hardware wallet, a different hot wallet, or wherever you
                prefer to receive&nbsp;funds.
              </p>
              <TipBox label="Payout schedule">
                <p>
                  Once you pass the challenge and your funded account is active, you
                  will receive an email notification every time a payout is sent. You
                  can update your payout address in the dashboard at any&nbsp;time.
                </p>
              </TipBox>
            </InfoCard>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 3 — Payment Methods
   ─────────────────────────────────────────────── */
function PaymentMethodsSection() {
  return (
    <section id="payment-methods" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <AnimatedSection>
          <SectionLabel>Step 2</SectionLabel>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Payment Methods
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-10">
            You can pay your one-time challenge fee using one of two methods.
            Both are processed in&nbsp;USDC.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pay with Hyperliquid */}
          <AnimatedSection>
            <div className="rounded-2xl border border-teal-400/20 bg-teal-400/[0.03] p-6 sm:p-8 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                  <Coin size={20} weight="fill" className="text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-200">
                  Pay with Hyperliquid
                </h3>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                The fastest option if you already have USDC in your Hyperliquid account.
                Transfers the challenge fee directly from your HL account balance.
              </p>

              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-300 mb-3">
                How it works
              </h4>
              <ol className="space-y-2 list-none p-0 mb-5">
                <NumberedStep number={1}>
                  Select <strong className="text-zinc-200 font-semibold">Pay with Hyperliquid</strong> during registration
                </NumberedStep>
                <NumberedStep number={2}>
                  The Hyperscaled Chrome extension auto-fills the transfer form
                </NumberedStep>
                <NumberedStep number={3}>
                  Approve the transfer in your Hyperliquid interface
                </NumberedStep>
                <NumberedStep number={4}>
                  Registration completes instantly
                </NumberedStep>
              </ol>

              <WarnBox label="Requirements">
                <p>
                  USDC must be in your HL account balance, not locked in open positions.
                  Close or reduce positions if you need to free up the balance.
                </p>
                <p>
                  <strong className="text-zinc-200 font-semibold">
                    You must pay from your HL main wallet.
                  </strong>{' '}
                  Hyperliquid does not allow sending funds from a subaccount.
                </p>
              </WarnBox>
            </div>
          </AnimatedSection>

          {/* Pay with Wallet */}
          <AnimatedSection>
            <div className="rounded-2xl border border-white/[0.08] bg-[#09090b] p-6 sm:p-8 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                  <CreditCard size={20} weight="fill" className="text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-200">
                  Pay with Wallet
                </h3>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Pay with <strong className="text-zinc-200 font-semibold">USDC on the Base network</strong>{' '}
                from any supported self-custody wallet. Your wallet connects automatically
                when you select this&nbsp;option.
              </p>

              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-300 mb-3">
                Supported wallets
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {['MetaMask', 'Coinbase Wallet', 'Rainbow', 'Rabby', 'WalletConnect'].map((w) => (
                  <span
                    key={w}
                    className="bg-[oklch(0.2_0_0)] border border-white/[0.1] rounded px-2 py-0.5 text-xs text-zinc-400"
                  >
                    {w}
                  </span>
                ))}
              </div>

              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-300 mb-3">
                Need USDC on Base?
              </h4>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                If your USDC is on another network or you need to acquire it, here
                are three common&nbsp;paths:
              </p>

              <div className="space-y-4">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <h5 className="text-sm font-semibold text-zinc-300 mb-2">
                    Via Coinbase
                  </h5>
                  <ol className="space-y-1.5 list-none p-0">
                    <NumberedStep number={1}>Buy USDC on Coinbase</NumberedStep>
                    <NumberedStep number={2}>
                      Send it and choose the <strong className="text-zinc-200 font-semibold">Base</strong> network
                    </NumberedStep>
                    <NumberedStep number={3}>
                      Enter your wallet address and confirm
                    </NumberedStep>
                  </ol>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <h5 className="text-sm font-semibold text-zinc-300 mb-2">
                    Via Bridge
                  </h5>
                  <ol className="space-y-1.5 list-none p-0">
                    <NumberedStep number={1}>
                      Go to{' '}
                      <a
                        href="https://bridge.base.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        bridge.base.org
                        <ArrowSquareOut size={12} weight="bold" />
                      </a>
                    </NumberedStep>
                    <NumberedStep number={2}>
                      Bridge USDC from Ethereum to Base
                    </NumberedStep>
                    <NumberedStep number={3}>
                      Wait approximately 2 minutes for confirmation
                    </NumberedStep>
                  </ol>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <h5 className="text-sm font-semibold text-zinc-300 mb-2">
                    Via Swap
                  </h5>
                  <ol className="space-y-1.5 list-none p-0">
                    <NumberedStep number={1}>
                      Switch your wallet to the <strong className="text-zinc-200 font-semibold">Base network</strong>
                    </NumberedStep>
                    <NumberedStep number={2}>
                      Visit{' '}
                      <a
                        href="https://app.uniswap.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:underline"
                      >
                        Uniswap
                      </a>
                      {' '}or{' '}
                      <a
                        href="https://aerodrome.finance"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:underline"
                      >
                        Aerodrome
                      </a>
                    </NumberedStep>
                    <NumberedStep number={3}>
                      Swap any Base token (ETH, etc.) for USDC
                    </NumberedStep>
                  </ol>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 4 — Challenge Rules
   ─────────────────────────────────────────────── */
function ChallengeRulesSection() {
  return (
    <section id="challenge-rules" className="px-6 pb-20 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <AnimatedSection>
          <SectionLabel>The Challenge</SectionLabel>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Challenge Rules
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-10">
            The Hyperscaled challenge is one step with straightforward rules. Every
            account size follows the same objectives. Pass once, and your funded account
            activates&nbsp;immediately.
          </p>
        </AnimatedSection>

        <div className="flex flex-col gap-6">
          {/* Rules Grid */}
          <AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Profit Target */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Target size={18} weight="fill" className="text-teal-400" />
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
                    Profit Target
                  </h3>
                </div>
                <p className="text-2xl font-bold font-mono text-zinc-200 mb-2">10%</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Reach 10% profit on your simulated account balance. For a $100K
                  account, that is&nbsp;$10,000.
                </p>
              </div>

              {/* Max Drawdown */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <TrendDown size={18} weight="fill" className="text-teal-400" />
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
                    Max Drawdown
                  </h3>
                </div>
                <p className="text-2xl font-bold font-mono text-zinc-200 mb-2">5%</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Two separate rules that both must stay within 5% during the
                  challenge&nbsp;phase.
                </p>
              </div>

              {/* No Time Limit */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Timer size={18} weight="fill" className="text-teal-400" />
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
                    Time Limit
                  </h3>
                </div>
                <p className="text-2xl font-bold font-mono text-zinc-200 mb-2">None</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Take as long as you need. There is no deadline, no minimum trading
                  days, and no consistency&nbsp;requirement.
                </p>
              </div>

              {/* Profit Split */}
              <div className="rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <CurrencyDollar size={18} weight="fill" className="text-teal-400" />
                  <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wide">
                    Profit Split
                  </h3>
                </div>
                <p className="text-2xl font-bold font-mono text-teal-400 mb-2">100%</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Hyperscaled takes 0% of your profits, including on scaled accounts
                  up to&nbsp;$2.5M.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Drawdown explained */}
          <AnimatedSection>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <h3 className="text-base font-semibold text-zinc-200 mb-4">
                Drawdown Rules Explained
              </h3>
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">
                    Daily Loss Limit (5%)
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Your account equity cannot drop more than 5% from the day's opening
                    equity at any point during the trading day. The day resets at
                    00:00&nbsp;UTC.
                  </p>
                </div>
                <div className="border-t border-white/[0.06] pt-5">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">
                    EOD Trailing Loss Limit (5%)
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Your end-of-day equity cannot drop more than 5% from your
                    end-of-day high water mark. This tracks the highest end-of-day
                    equity your account has reached and ensures you do not give back
                    more than 5% from that&nbsp;peak.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Scaling after passing */}
          <AnimatedSection>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <h3 className="text-base font-semibold text-zinc-200 mb-4">
                After You Pass: Account Scaling
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Passing the challenge activates your funded account immediately. From
                there, consistent quarterly performance unlocks progressively larger
                account sizes, with no additional fees and no&nbsp;application.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
                    Tier I & II
                  </h4>
                  <p className="text-sm text-zinc-300">
                    $25K and $50K accounts scale up to{' '}
                    <strong className="font-mono font-semibold">$100K</strong> maximum
                  </p>
                </div>
                <div className="rounded-lg border border-teal-400/20 bg-teal-400/[0.04] p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-teal-400/80 mb-2">
                    Tier III
                  </h4>
                  <p className="text-sm text-zinc-300">
                    $100K accounts scale up to{' '}
                    <strong className="font-mono font-semibold text-teal-400">$2.5M</strong> maximum
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
                Scaling requires a 5% quarterly return and an all-time Sharpe ratio
                above 1. See the{' '}
                <Link href="/rules#scaling" className="text-teal-400 hover:underline">
                  full scaling rules
                </Link>{' '}
                for the complete path from $100K to&nbsp;$2.5M.
              </p>
            </div>
          </AnimatedSection>

          {/* Breach callout */}
          <AnimatedSection>
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.04] p-5 flex items-start gap-3">
              <Warning size={20} weight="fill" className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 leading-relaxed">
                Breaching either drawdown rule results in immediate challenge
                termination. You may re-register and start a new challenge at
                any&nbsp;time.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 5 — After Registration
   ─────────────────────────────────────────────── */
function AfterRegistrationSection() {
  return (
    <section id="after-registration" className="px-6 pb-24 scroll-mt-[110px]">
      <div className="max-w-[900px] mx-auto">
        <AnimatedSection>
          <SectionLabel>What Happens Next</SectionLabel>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            After Registration
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-10">
            Once your payment confirms, your challenge account is provisioned
            immediately and trade mirroring&nbsp;begins.
          </p>
        </AnimatedSection>

        {/* Timeline */}
        <AnimatedSection>
          <div className="relative">
            {/* Vertical line — desktop only */}
            <div className="hidden md:block absolute left-[23px] top-6 bottom-6 w-px bg-white/[0.08]" />

            <div className="space-y-6">
              {[
                {
                  icon: Gear,
                  title: 'Account Provisioned',
                  body: 'Your challenge account is created instantly after payment. You will receive a confirmation email with your account details and a link to your dashboard.',
                },
                {
                  icon: PuzzlePiece,
                  title: 'Install the Chrome Extension',
                  body: 'The Hyperscaled Chrome extension connects to your Hyperliquid interface and enables seamless trade mirroring. It also shows your live challenge progress directly in the Hyperliquid UI.',
                },
                {
                  icon: ChartLineUp,
                  title: 'Start Trading on Hyperliquid',
                  body: 'Open Hyperliquid and trade as you normally would. Nothing about your workflow changes. No API keys, no separate platform, no custody of your funds.',
                },
                {
                  icon: Eye,
                  title: 'Trades Are Mirrored Automatically',
                  body: 'Hyperscaled reads your fills from the public data stream and mirrors every trade proportionally to your simulated funded account. No action needed from you.',
                },
                {
                  icon: Target,
                  title: 'Track Your Progress on the Dashboard',
                  body: 'Your Hyperscaled dashboard shows live P&L, drawdown status, profit target progress, and expected payout. Updates in real time as you trade.',
                },
                {
                  icon: HandCoins,
                  title: 'Get Paid When Profitable',
                  body: 'Pass the 10% profit target and your funded account activates. From there, monthly USDC payouts are calculated automatically and sent to your payout wallet.',
                },
              ].map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="flex items-start gap-5">
                    <div className="relative z-10 w-12 h-12 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                      <Icon size={20} weight="fill" className="text-teal-400" />
                    </div>
                    <div className="pt-1 flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-zinc-200 mb-1.5">
                        {step.title}
                      </h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* Final CTA */}
        <AnimatedSection className="mt-14">
          <div className="rounded-2xl border border-teal-400/20 bg-teal-400/[0.04] p-8 sm:p-10 text-center">
            <h3
              className="text-xl sm:text-2xl font-bold tracking-tight mb-4"
              style={{ textWrap: 'balance' }}
            >
              Ready to start your challenge?
            </h3>
            <p
              className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6 max-w-[48ch] mx-auto"
              style={{ textWrap: 'balance' }}
            >
              Pick your account size, pay once, and start trading on Hyperliquid.
              Your funded account is one challenge&nbsp;away.
            </p>
            <Link
              href="/prod-register"
              className="shiny-cta inline-flex items-center gap-1.5 px-6 py-3 min-h-12"
            >
              <span className="flex items-center gap-1.5">
                Start Your Challenge
                <ArrowRight size={15} weight="bold" />
              </span>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Page Compose
   ─────────────────────────────────────────────── */
export default function GettingStartedPage() {
  const activeId = useActiveSection()

  return (
    <>
      <PageHero />
      <TableOfContents activeId={activeId} />
      <div data-toc-content>
        <RegistrationSection />
        <PaymentMethodsSection />
        <ChallengeRulesSection />
        <AfterRegistrationSection />
      </div>
    </>
  )
}
