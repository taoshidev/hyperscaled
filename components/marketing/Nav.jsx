'use client'

import { motion } from 'framer-motion'
import { DownloadSimple } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const links = [
  { label: 'Protocol', href: '#solution' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

export default function Nav() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#09090b]/60 border-b border-white/[0.06]"
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <a href="#" className="flex items-center">
          <img src="/hyperscaled-logo.svg" alt="Hyperscaled" className="h-7 w-auto" />
        </a>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right links + CTA */}
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors">Leaderboard</a>
          <a href="#" className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors">Rules</a>
          <a href="/status" className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors">Status</a>
          <a
            href="#get-funded"
            className="shiny-cta px-5 py-2"
          >
            <span className="flex items-center gap-1.5">
              <DownloadSimple size={15} weight="bold" />
              Extension
            </span>
          </a>
        </div>
      </div>
    </motion.header>
  )
}
