'use client'

import Link from 'next/link'
import { useBrand, useBrandHref } from '@/lib/brand'
import { trackCtaClick } from '@/lib/analytics'

export default function PromoBanner() {
  const brand = useBrand()
  const brandHref = useBrandHref()

  return (
    <div className="relative z-10 bg-teal-400 w-full">
      <Link
        href={brandHref('/register')}
        onClick={() => trackCtaClick({ label: 'Promo Banner', location: 'promo_bar' })}
        className="flex items-center justify-center gap-3 px-6 py-2.5 hover:bg-teal-300 transition-colors"
      >
        <img
          src={brand.mark}
          alt={brand.name}
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
