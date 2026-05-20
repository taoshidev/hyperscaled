'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, List, X, DotsThree, ArrowSquareOut } from '@phosphor-icons/react'
import { CHROME_EXTENSION_URL } from '@/lib/constants'
import { useBrand, useBrandHref } from '@/lib/brand'
import { useWithPreservedQuery } from '@/lib/preserve-query'
import { trackCtaClick } from '@/lib/analytics'
import NavStartChallengeCta from './NavStartChallengeCta'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

/* Primary nav links — always visible on desktop */
const PRIMARY_LINKS = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'For Agents', href: '/agents' },
  { label: 'Rules', href: '/rules' },
  { label: 'FAQ', href: '/faq' },
]

/* Dropdown menu items — behind the "More" button */
const DROPDOWN_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Partners', href: '/partners' },
]

/* All links combined for the mobile hamburger menu */
const ALL_LINKS = [...PRIMARY_LINKS, ...DROPDOWN_LINKS]

function MoreDropdown({ brandHref, brand }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close menu' : 'More options'}
        aria-expanded={open}
        className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-2 rounded-lg border border-white/[0.08] bg-zinc-900/80"
      >
        <DotsThree size={18} weight="bold" />
        More
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/[0.08] bg-[#0c0c0e]/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden z-50"
          >
            <div className="py-1.5">
              {DROPDOWN_LINKS
                .filter((l) => l.label !== 'Partners' || brand.showPartnersCTA)
                .map((l) => (
                <Link
                  key={l.label}
                  href={brandHref(l.href)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  {l.label}
                </Link>
              ))}

              <div className="mx-3 my-1.5 border-t border-white/[0.06]" />

              {brand.showExtension && (
                <a
                  href={CHROME_EXTENSION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackCtaClick({ label: 'Chrome Extension', location: 'nav_dropdown' })
                    setOpen(false)
                  }}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Chrome Extension
                  <ArrowSquareOut size={13} weight="bold" className="text-zinc-600" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// `walletAware` swaps in a CTA variant that hides itself when the
// connected wallet has an active registration. Only enable this on
// layouts that mount `<Providers>` (the wallet-aware CTA uses wagmi).
export default function Nav({ excludeLinks = [], walletAware = false }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const brand = useBrand()
  const brandHref = useBrandHref()
  const withQS = useWithPreservedQuery()

  const primaryLinks = excludeLinks.length
    ? PRIMARY_LINKS.filter((l) => !excludeLinks.includes(l.label))
    : PRIMARY_LINKS
  const allLinks = excludeLinks.length
    ? ALL_LINKS.filter((l) => !excludeLinks.includes(l.label))
    : ALL_LINKS

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
        <nav className="hidden md:flex items-center justify-center flex-1 min-w-0 mx-8">
          <div className="flex items-center gap-10 overflow-hidden">
          {primaryLinks.map((l) => (
            <Link
              key={l.label}
              href={brandHref(l.href)}
              className="text-sm text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
          </div>
        </nav>

        {/* CTA + More dropdown + hamburger */}
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <MoreDropdown brandHref={brandHref} brand={brand} />

          {walletAware ? (
            <NavStartChallengeCta />
          ) : (
            <Link
              href={withQS(brandHref('/register'))}
              onClick={() => trackCtaClick({ label: 'Start Challenge', location: 'nav' })}
              className="shiny-cta px-5 py-2"
            >
              <span className="flex items-center gap-1.5">
                Start Challenge
                <ArrowRight size={15} weight="bold" />
              </span>
            </Link>
          )}

          {/* Hamburger — visible below md */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Hamburger menu — all links for mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl px-6 pb-6 pt-4"
          >
            <div className="flex flex-col gap-1">
              {allLinks
                .filter((l) => l.label !== 'Partners' || brand.showPartnersCTA)
                .map((l) => (
                <Link
                  key={l.label}
                  href={brandHref(l.href)}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors py-2.5 border-b border-white/[0.04] last:border-0"
                >
                  {l.label}
                </Link>
              ))}
              {brand.showExtension && (
                <a
                  href={CHROME_EXTENSION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackCtaClick({ label: 'Chrome Extension', location: 'nav_mobile' })
                    setMobileOpen(false)
                  }}
                  className="flex items-center justify-between text-sm text-zinc-400 hover:text-white transition-colors py-2.5"
                >
                  Chrome Extension
                  <ArrowSquareOut size={13} weight="bold" className="text-zinc-600" />
                </a>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
    </>
  )
}
