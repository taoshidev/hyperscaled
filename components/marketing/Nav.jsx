'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, DownloadSimple, List, X } from '@phosphor-icons/react'
import ExtensionModal from '@/components/marketing/ExtensionModal'
import { useBrand, useBrandHref } from '@/lib/brand'
import { trackCtaClick } from '@/lib/analytics'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

/*
  Progressive responsive collapse:
  - xl+ (>1280px): all 8 links visible, no hamburger
  - md–xl (768–1280px): How It Works, Pricing, For Agents, Rules visible
  - <md (<768px): all links in hamburger only

  Always visible at desktop: How It Works → Pricing → For Agents → Rules
  Collapse to hamburger: Partners → Dashboard → Leaderboard → FAQ
*/
const NAV_LINKS = [
  { label: 'How It Works', href: '/how-it-works', visibility: 'hidden md:block' },
  { label: 'Pricing', href: '/pricing', visibility: 'hidden md:block' },
  { label: 'For Agents', href: '/agents', visibility: 'hidden md:block' },
  { label: 'Rules', href: '/rules', visibility: 'hidden lg:block' },
  { label: 'Dashboard', href: '/dashboard', visibility: 'hidden lg:block' },
  { label: 'Leaderboard', href: '/leaderboard', visibility: 'hidden xl:block' },
  { label: 'Partners', href: '/partners', visibility: 'hidden xl:block' },
  { label: 'FAQ', href: '/faq', visibility: 'hidden xl:block' },
]

export default function Nav({ excludeLinks = [] }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [extensionOpen, setExtensionOpen] = useState(false)
  const brand = useBrand()
  const brandHref = useBrandHref()
  const links = excludeLinks.length
    ? NAV_LINKS.filter((l) => !excludeLinks.includes(l.label))
    : NAV_LINKS

  function handleExtensionClick() {
    // Trigger download
    const a = document.createElement('a')
    a.href = '/hyperscaled_extension.zip'
    a.download = 'hyperscaled_extension.zip'
    a.click()
    // Open install instructions
    setExtensionOpen(true)
  }

  return (
    <>
    {brand.parentSite && (
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 border-b border-white/[0.06] backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-8 flex items-center">
          <a
            href={brand.parentSite.url}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} weight="bold" />
            {brand.parentSite.label}
          </a>
        </div>
      </div>
    )}
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring}
      className={`fixed left-0 right-0 z-50 backdrop-blur-xl bg-[#09090b]/60 border-b border-white/[0.06] ${brand.parentSite ? 'top-8' : 'top-0'}`}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4 relative">
        {/* Logo */}
        <Link href={brandHref('/')} className="flex items-center gap-2 shrink-0 relative z-10">
          <img src={brand.logo} alt={brand.name} className="h-7 w-auto" />
          {brand.showBetaBadge && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400 border border-teal-400/30 bg-teal-400/10 rounded px-1.5 py-0.5 leading-none">Beta</span>
          )}
        </Link>

        {/* Desktop nav — centered between logo and CTA */}
        <nav className="hidden md:flex items-center justify-center flex-1 min-w-0 mx-4">
          <div className="flex items-center gap-6 overflow-hidden">
          {links.map((l) => (
            <Link
              key={l.label}
              href={brandHref(l.href)}
              className={`text-sm text-zinc-400 hover:text-white transition-colors whitespace-nowrap ${l.visibility}`}
            >
              {l.label}
            </Link>
          ))}
          </div>
        </nav>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          {brand.showExtension && (
            <button
              type="button"
              onClick={handleExtensionClick}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-lg border border-white/[0.08] bg-zinc-900/80"
            >
              <DownloadSimple size={15} weight="bold" />
              Extension
            </button>
          )}
          <Link
            href={brandHref('/register')}
            onClick={() => trackCtaClick({ label: 'Start Challenge', location: 'nav' })}
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
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={brandHref(l.href)}
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

    <ExtensionModal open={extensionOpen} onClose={() => setExtensionOpen(false)} />
    </>
  )
}
