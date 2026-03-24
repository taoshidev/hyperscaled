'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const links = [
  { label: 'Protocol', href: '#solution' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

export default function Nav({ onSearch }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const val = query.trim()
    if (!val) return
    if (onSearch) {
      onSearch(val)
    } else {
      window.location.href = `/leaderboard?addr=${encodeURIComponent(val)}`
    }
    setQuery('')
    inputRef.current?.blur()
  }

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#09090b]/60 border-b border-white/[0.06]"
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Wordmark */}
        <a href="/" className="flex items-center shrink-0">
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

        {/* Address search */}
        <form
          onSubmit={handleSubmit}
          className="hidden md:flex items-center flex-1 max-w-xs relative"
        >
          <MagnifyingGlass
            size={13}
            className="absolute left-3 text-zinc-600 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by HL address..."
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900/80 border border-white/[0.08] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-teal-400/40 transition-colors"
          />
        </form>

        {/* Right links + CTA */}
        <div className="flex items-center gap-6 shrink-0">
          <a href="/leaderboard" className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors">Leaderboard</a>
          <a href="/dashboard" className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</a>
          <a href="#" className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors">Rules</a>
          <a href="/status" className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors">Status</a>
          <Link href="/agents" className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors">For Agents</Link>
          <Link
            href="/register"
            className="shiny-cta px-5 py-2"
          >
            <span className="flex items-center gap-1.5">
              Start Evaluation
              <ArrowRight size={15} weight="bold" />
            </span>
          </Link>
        </div>
      </div>
    </motion.header>
  )
}
