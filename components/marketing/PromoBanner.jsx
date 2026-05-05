'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from '@phosphor-icons/react'
import { useBrand, useBrandHref } from '@/lib/brand'
import { trackCtaClick } from '@/lib/analytics'

const DEAL_END = new Date('2026-05-19T23:59:59')

function getTimeLabel() {
  const now = new Date()
  const diff = DEAL_END - now
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 1) return `Ends in ${days} days`
  if (days === 1) return 'Ends tomorrow'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours >= 1) return `Ends in ${hours}h`
  return 'Ends soon'
}

export default function PromoBanner() {
  const brand = useBrand()
  const brandHref = useBrandHref()
  const brandName = brand.id === 'vanta' ? 'Vanta' : 'Hyperscaled'
  const [dismissed, setDismissed] = useState(false)
  const timeLabel = getTimeLabel()

  if (dismissed || !timeLabel) return null

  return (
    <div className="relative z-10 w-full bg-[#111316] border-b border-white/[0.06]">
      <div className="flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 max-w-[1400px] mx-auto">
        {/* WSB logo */}
        <img
          src="/wsb-logo.svg"
          alt="WallStreetBets"
          className="h-9 w-9 rounded-lg shrink-0 hidden sm:block"
        />

        {/* Deal info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Flash deal · {timeLabel}
          </span>
          <span className="text-xs sm:text-sm text-zinc-300 truncate">
            WallStreetBets x {brandName} — use code{' '}
            <span className="font-mono font-semibold text-white">&ldquo;WSB&rdquo;</span>{' '}
            for 50% off all challenges
          </span>
        </div>

        {/* Code badge + CTA + dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md border border-white/[0.12] bg-white/[0.04] text-xs font-mono font-semibold text-white tracking-wide">
            WSB
          </span>
          <Link
            href={brandHref('/register')}
            onClick={() => trackCtaClick({ label: 'WSB Flash Deal', location: 'promo_bar' })}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors whitespace-nowrap"
          >
            Claim offer →
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="p-1 rounded text-zinc-500 hover:text-white transition-colors"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}
