'use client'

import Link from 'next/link'
import { useBrand, useBrandHref } from '@/lib/brand'
import { trackCtaClick } from '@/lib/analytics'
import { WSB_PROMO, isWsbBrand } from '@/lib/constants'

// Fixed banner height. Nav renders a matching spacer (PROMO_BANNER_HEIGHT_CLASS)
// in-flow so page content clears the taller fixed header. Keep these in sync.
export const PROMO_BANNER_HEIGHT_CLASS = 'h-9'

export default function PromoBanner() {
  const brand = useBrand()
  const brandHref = useBrandHref()

  // WSB promo runs on Hyperscaled and Vanta only.
  if (!isWsbBrand(brand.id) || !WSB_PROMO.active) return null

  const brandName = brand.id === 'vanta' ? 'Vanta' : 'Hyperscaled'

  return (
    <div className={`w-full bg-white ${PROMO_BANNER_HEIGHT_CLASS} overflow-hidden`}>
      <div className="h-full flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 max-w-[1400px] mx-auto">
        <img
          src="/wsb-logo.svg"
          alt="WallStreetBets"
          className="h-7 w-7 rounded-sm shrink-0"
        />

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 whitespace-nowrap tracking-tight uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            Flash deal · Ends {WSB_PROMO.endsLabel}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-zinc-900 truncate tracking-tight">
            WallStreetBets x {brandName} — <span className="text-teal-600">{WSB_PROMO.discountPct}% off all challenges</span>
          </span>
        </div>

        <Link
          href={brandHref('/register')}
          onClick={() => trackCtaClick({ label: 'WSB Flash Deal', location: 'promo_bar' })}
          className="inline-flex items-center gap-1 px-3.5 py-1 rounded-md bg-teal-400 text-black text-xs font-bold hover:bg-teal-300 transition-colors whitespace-nowrap shrink-0 tracking-tight"
        >
          Claim offer →
        </Link>
      </div>
    </div>
  )
}
