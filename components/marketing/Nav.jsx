'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, List, X } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

/*
  Progressive responsive collapse:
  - xl+ (>1280px): all 7 links visible, no hamburger
  - lg–xl (1024–1280px): How It Works, Pricing, For Agents, Rules visible
  - md–lg (768–1024px): How It Works, Pricing, For Agents visible
  - <md (<768px): all links in hamburger only

  Priority (stays visible longest): How It Works → Pricing → For Agents
*/
const NAV_LINKS = [
  { label: 'How It Works', href: '/how-it-works', visibility: 'hidden md:block' },
  { label: 'Pricing', href: '/pricing', visibility: 'hidden md:block' },
  { label: 'For Agents', href: '/agents', visibility: 'hidden md:block' },
  { label: 'Rules', href: '/rules', visibility: 'hidden lg:block' },
  { label: 'Leaderboard', href: '/leaderboard', visibility: 'hidden xl:block' },
  { label: 'Partners', href: '/partners', visibility: 'hidden xl:block' },
  { label: 'FAQ', href: '/faq', visibility: 'hidden xl:block' },
]

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#09090b]/60 border-b border-white/[0.06]"
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <img src="/hyperscaled-logo.svg" alt="Hyperscaled" className="h-7 w-auto" />
        </Link>

        {/* Desktop nav — progressively visible links */}
        <nav className="flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`text-sm text-zinc-400 hover:text-white transition-colors whitespace-nowrap ${l.visibility}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/register"
            className="shiny-cta px-5 py-2"
          >
            <span className="flex items-center gap-1.5">
              Start Challenge
              <ArrowRight size={15} weight="bold" />
            </span>
          </Link>

          {/* Hamburger — visible when any links are hidden (below xl) */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="xl:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Hamburger menu — always contains ALL links */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="xl:hidden border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl px-6 pb-6 pt-4"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors py-2.5 border-b border-white/[0.04] last:border-0"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
