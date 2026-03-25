'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, MagnifyingGlass, List, X } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const leftLinks = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Features', href: '/features' },
  { label: 'Partners', href: '/partners' },
  { label: 'FAQ', href: '/faq' },
]

const rightLinks = [
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Rules', href: '/rules' },
  { label: 'For Agents', href: '/agents' },
]

const allLinks = [...leftLinks, ...rightLinks]

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/miner/${encodeURIComponent(trimmed)}`)
      setQuery('')
    }
  }

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

        {/* Desktop: left links */}
        <nav className="hidden xl:flex items-center gap-6">
          {leftLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Search input */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center">
          <div className="relative">
            <MagnifyingGlass
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="0x...."
              className="w-40 lg:w-48 h-9 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.16] transition-colors"
            />
          </div>
        </form>

        {/* Desktop: right links */}
        <nav className="hidden xl:flex items-center gap-6">
          {rightLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/register"
            className="shiny-cta px-5 py-2"
          >
            <span className="flex items-center gap-1.5">
              Start Evaluation
              <ArrowRight size={15} weight="bold" />
            </span>
          </Link>

          {/* Mobile menu toggle */}
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="xl:hidden border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl px-6 pb-6 pt-4"
          >
            {/* Mobile search */}
            <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false) }} className="mb-4 md:hidden">
              <div className="relative">
                <MagnifyingGlass
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="0x...."
                  className="w-full h-10 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.16] transition-colors"
                />
              </div>
            </form>

            <div className="flex flex-col gap-1">
              {allLinks.map((l) => (
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
