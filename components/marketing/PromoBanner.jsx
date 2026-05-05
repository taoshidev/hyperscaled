'use client'

import Link from 'next/link'
import { useBrand, useBrandHref } from '@/lib/brand'
import { trackCtaClick } from '@/lib/analytics'

export default function PromoBanner() {
  const brand = useBrand()
  const brandHref = useBrandHref()
  const brandName = brand.id === 'vanta' ? 'Vanta' : 'Hyperscaled'

  return (
    <div className="relative z-10 w-full bg-teal-400">
      <div className="flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 max-w-[1400px] mx-auto">
        {/* WSB logo */}
        <img
          src="/wsb-logo.svg"
          alt="WallStreetBets"
          className="h-9 w-9 rounded-lg shrink-0 hidden sm:block"
        />

        {/* Deal info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-black whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
            Flash deal · Ends May 19
          </span>
          <span className="text-xs sm:text-sm text-black/80 truncate">
            WallStreetBets x {brandName} — use code{' '}
            <span className="font-mono font-bold text-black">&ldquo;WSB&rdquo;</span>{' '}
            for 50% off all challenges
          </span>
        </div>

        {/* CTA */}
        <Link
          href={brandHref('/register')}
          onClick={() => trackCtaClick({ label: 'WSB Flash Deal', location: 'promo_bar' })}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-teal-400 text-xs font-semibold hover:bg-zinc-900 transition-colors whitespace-nowrap shrink-0"
        >
          Claim offer →
        </Link>
      </div>
    </div>
  )
}
