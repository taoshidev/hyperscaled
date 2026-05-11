'use client'

import Link from 'next/link'
import { useBrand, useBrandHref } from '@/lib/brand'
import { trackCtaClick } from '@/lib/analytics'

/* ── Hyperscaled: teal $1k challenge bar ── */
function HyperscaledBanner({ brandHref, mark }) {
  return (
    <div className="relative z-10 bg-teal-400 w-full">
      <Link
        href={brandHref('/register')}
        onClick={() => trackCtaClick({ label: 'Promo Banner', location: 'promo_bar' })}
        className="flex items-center justify-center gap-3 px-6 py-2.5 hover:bg-teal-300 transition-colors"
      >
        <img
          src={mark}
          alt="Hyperscaled"
          className="h-5 w-auto brightness-0 invert"
        />
        <span className="text-xs sm:text-sm font-medium text-black text-center">
          Free $1k challenge accounts are live — only 1,000 are available.{' '}
          <span className="underline underline-offset-2 font-semibold">
            Claim yours →
          </span>
        </span>
      </Link>
    </div>
  )
}

/* ── Vanta: WSB flash deal bar ── */
function WsbBanner({ brandHref }) {
  return (
    <div className="relative z-10 w-full bg-white">
      <div className="flex items-center justify-center gap-4 sm:gap-5 px-4 sm:px-6 py-1.5 max-w-[1400px] mx-auto">
        <img
          src="/wsb-logo.svg"
          alt="WallStreetBets"
          className="h-20 w-20 -my-4 rounded-lg shrink-0 hidden sm:block"
        />

        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-500 whitespace-nowrap tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            Flash deal · Ends May 19
          </span>
          <span className="text-xs sm:text-sm font-medium text-zinc-800 truncate tracking-tight">
            WallStreetBets x Hyperscaled — 50% off all challenges
          </span>
        </div>

        <Link
          href={brandHref('/register')}
          onClick={() => trackCtaClick({ label: 'WSB Flash Deal', location: 'promo_bar' })}
          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-teal-400 text-black text-xs font-semibold hover:bg-teal-300 transition-colors whitespace-nowrap shrink-0 tracking-tight"
        >
          Limited-time offer →
        </Link>
      </div>
    </div>
  )
}

export default function PromoBanner() {
  const brand = useBrand()
  const brandHref = useBrandHref()

  if (brand.id === 'vanta') {
    return <WsbBanner brandHref={brandHref} />
  }

  return <HyperscaledBanner brandHref={brandHref} mark={brand.mark} />
}
