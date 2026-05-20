'use client'

import Link from 'next/link'
import { useBrand, useBrandHref } from '@/lib/brand'
import { useWithPreservedQuery } from '@/lib/preserve-query'
import { trackCtaClick } from '@/lib/analytics'
import { isWsbSaleBannerPublic } from '@/lib/wsb-sale-banner-public'

export default function PromoBanner() {
  const brand = useBrand()
  const brandHref = useBrandHref()
  const withQS = useWithPreservedQuery()

  if (!isWsbSaleBannerPublic()) return null

  if (brand.id !== 'hyperscaled' && brand.id !== 'vanta') return null

  const brandName = brand.id === 'vanta' ? 'Vanta' : 'Hyperscaled'

  return (
    <div className="relative z-10 w-full bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-4 px-4 py-1.5 sm:gap-5 sm:px-6">
        <img
          src="/wsb-logo.svg"
          alt="WallStreetBets"
          className="-my-4 hidden h-20 w-20 shrink-0 rounded-lg sm:block"
        />

        <div className="flex min-w-0 max-w-full items-center justify-center gap-2.5 sm:gap-3.5">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-tight whitespace-nowrap text-teal-500">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
            Flash deal · Ends May 19
          </span>
          <span className="truncate text-xs font-medium tracking-tight text-zinc-800 sm:text-sm">
            WallStreetBets x {brandName} — 50% off all challenges
          </span>
        </div>

        <Link
          href={withQS(brandHref('/register'))}
          onClick={() => trackCtaClick({ label: 'WSB Flash Deal', location: 'promo_bar' })}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-teal-400 px-4 py-1.5 text-xs font-semibold tracking-tight whitespace-nowrap text-black transition-colors hover:bg-teal-300"
        >
          Claim offer →
        </Link>
      </div>
    </div>
  )
}
