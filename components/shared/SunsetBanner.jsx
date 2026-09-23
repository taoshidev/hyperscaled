'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Warning, X } from '@phosphor-icons/react'
import { SUNSET_BANNER_COPY } from '@/lib/sunset'
import VantaTradingLink from '@/components/shared/VantaTradingLink'
import {
  dismissSunsetBanner,
  useSunsetBannerDismissed,
  useSunsetBannerDismissible,
} from '@/lib/sunset-banner-store'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Notion #1560 — site-wide retirement notice, pinned above the nav on every
// page of every brand (the staff command center excluded). It is sticky in
// normal flow, so page content is pushed down by its real height without JS.
// Fixed/sticky chrome (nav, parent-site bar, TOCs) reads its height from
// --site-banner-h, which this component keeps current.
export default function SunsetBanner() {
  const pathname = usePathname()
  const dismissible = useSunsetBannerDismissible()
  const dismissed = useSunsetBannerDismissed()
  const ref = useRef(null)

  const excluded = pathname?.startsWith('/command-center') ?? false
  const hidden = excluded || (dismissible && dismissed)

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement
    const el = ref.current
    if (hidden || !el) {
      root.style.setProperty('--site-banner-h', '0px')
      return
    }
    const apply = () => root.style.setProperty('--site-banner-h', `${el.offsetHeight}px`)
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [hidden])

  if (hidden) return null

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Hyperscaled retirement notice"
      data-testid="sunset-banner"
      className="sticky top-0 z-[60] w-full border-b border-amber-500/30 bg-[#09090b]"
    >
      <div className="bg-amber-500/[0.08]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <Warning size={16} weight="fill" aria-hidden="true" className="shrink-0 text-amber-400" />

          {/* Desktop / full width */}
          <p className="hidden min-w-0 flex-1 text-xs leading-5 text-zinc-200 sm:block lg:text-sm">
            {SUNSET_BANNER_COPY.desktop}
          </p>
          <VantaTradingLink
            label={SUNSET_BANNER_COPY.desktopCta}
            location="sunset_banner"
            data-testid="sunset-banner-cta"
            className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/20 focus-visible:ring-2 focus-visible:ring-amber-400 outline-none sm:inline-flex"
          >
            {SUNSET_BANNER_COPY.desktopCta}
            <ArrowUpRight size={12} weight="bold" aria-hidden="true" />
          </VantaTradingLink>

          {/* Mobile / compact (under 640px) */}
          <p className="min-w-0 flex-1 text-xs leading-5 text-zinc-200 sm:hidden">
            {SUNSET_BANNER_COPY.mobile}{' '}
            <VantaTradingLink
              label={SUNSET_BANNER_COPY.mobileCta}
              location="sunset_banner_mobile"
              data-testid="sunset-banner-cta-mobile"
              className="whitespace-nowrap font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-amber-400 outline-none"
            >
              {SUNSET_BANNER_COPY.mobileCta}
            </VantaTradingLink>
          </p>

          {dismissible && (
            <button
              type="button"
              onClick={dismissSunsetBanner}
              aria-label="Dismiss notice"
              data-testid="sunset-banner-dismiss"
              className="-my-2 -mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-amber-400 outline-none"
            >
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
