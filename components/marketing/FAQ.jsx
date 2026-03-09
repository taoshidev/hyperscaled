'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Plus, Minus } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const faqs = [
  {
    q: 'Do I need to submit KYC documents?',
    a: 'No, you simply use a digital signature via Privado. Hyperscaled is a permissionless protocol. You connect with a Hyperliquid wallet address. Traders in 150+ countries can participate today.',
  },
  {
    q: 'How does the one-step evaluation work?',
    a: 'Trade on Hyperliquid normally while the protocol mirrors your wallet into a simulated funded account. Hit 10% profit on your evaluation account while keeping max drawdown under 5%. That\'s it — no second phase, no surprise rule changes.',
  },
  {
    q: 'When and how do I get paid?',
    a: 'Funded traders receive USDC directly to their connected wallet every month. Every payout is recorded onchain — no centralized discretion, no hold periods, no withdrawal fees.',
  },
  {
    q: 'What markets can I trade?',
    a: 'BTC, ETH, ADA, XRP, SOL, DOGE perps on Hyperliquid with HYPE, TAO, LINK, ZEC, BCH, XMR, and LTC being added. News trading and weekend trading are both allowed. No restricted windows.',
  },
  {
    q: 'How does account scaling work?',
    a: 'Strong quarterly performance triggers automatic promotions. Traders can scale from $100K up to $2.5M funded capital with no additional evaluation fees. Every scaling milestone is governed by a decentralized set of rules set by validators.',
  },
  {
    q: 'What is Hyperscaled built on?',
    a: 'Hyperscaled is a Web3 protocol built on Hyperliquid\'s order book infrastructure and powered by the Bittensor network. All rules, payout logic, and trader records are open-source and verifiable onchain.',
  },
]

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay: index * 0.06 }}
      className="border-b border-white/[0.06] last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-5 text-left gap-4 group"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors leading-snug">
          {item.q}
        </span>
        <span className="shrink-0 mt-0.5">
          {open ? (
            <Minus size={16} className="text-teal-400" />
          ) : (
            <Plus size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            style={{ overflow: 'hidden' }}
          >
            <p className="text-sm text-zinc-400 leading-relaxed pb-5 max-w-[68ch]">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="faq" ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Left — sticky headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={spring}
            className="md:sticky md:top-28"
          >
            <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl tracking-tighter leading-none font-bold mb-5">
              Questions traders actually ask.
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed max-w-[46ch]">
              No fine print, no vague answers. If something isn&apos;t clear here, it&apos;s spelled
              out in the open-source protocol rules.
            </p>

            <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
              <div className="text-xs text-zinc-500 mb-1">Still have questions?</div>
              <a
                href="https://discord.gg/hyperscaled"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium"
              >
                Join our Discord →
              </a>
            </div>
          </motion.div>

          {/* Right — accordion */}
          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {faqs.map((item, i) => (
              <FAQItem key={item.q} item={item} index={i} />
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
