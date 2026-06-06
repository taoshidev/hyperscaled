'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useBrand, useBrandHref } from '@/lib/brand'
import { useWithPreservedQuery } from '@/lib/preserve-query'
import { trackCtaClick } from '@/lib/analytics'

function getCountdownParts(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function countdownAriaLabel(parts) {
  const segments = []
  if (parts.days > 0) segments.push(`${parts.days} days`)
  segments.push(`${parts.hours} hours`)
  segments.push(`${parts.minutes} minutes`)
  segments.push(`${parts.seconds} seconds`)
  return `Ends in ${segments.join(', ')}`
}

/** A single time unit rendered as a compact pill (value + unit suffix). */
function TimeUnit({ value, unit, pad = true }) {
  return (
    <span className="inline-flex items-baseline gap-0.5 rounded-md bg-zinc-900/[0.06] px-1.5 py-0.5 leading-none ring-1 ring-inset ring-zinc-900/[0.06]">
      <span className="font-mono text-xs font-bold tabular-nums text-zinc-900">
        {pad ? String(value).padStart(2, '0') : value}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
        {unit}
      </span>
    </span>
  )
}

/**
 * DB-driven promotional banner. Receives the active campaign (already
 * resolved on the server) and renders a teal pill with countdown +
 * call-to-action. When `campaign` is null (no active promo) it renders
 * nothing.
 *
 * @param {{ campaign?: import('@/lib/campaign-pricing').ActiveCampaignClient | null }} props
 */
export default function PromoBanner({ campaign }) {
  const brand = useBrand()
  const brandHref = useBrandHref()
  const withQS = useWithPreservedQuery()

  const endsAtMs = useMemo(() => {
    if (!campaign?.endsAt) return null
    const ms = Date.parse(campaign.endsAt)
    return Number.isFinite(ms) ? ms : null
  }, [campaign?.endsAt])

  // `now` stays null until the component mounts on the client. The countdown
  // is time-derived, so rendering it during SSR/hydration would produce a
  // mismatch. We gate it on `now`: the server and the first client render omit
  // the live countdown, then the post-mount effect populates and ticks it.
  const [now, setNow] = useState(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (endsAtMs == null) {
      setNow(Date.now())
      return undefined
    }
    const update = () => {
      const t = Date.now()
      setNow(t)
      if (t >= endsAtMs) setExpired(true)
    }
    update()
    const t = setInterval(update, 1_000)
    return () => clearInterval(t)
  }, [endsAtMs])

  if (!campaign || !campaign.bannerEnabled) return null
  if (expired) return null

  const headline = campaign.bannerText || campaign.name
  const code = campaign.coupon?.code
  const countdownParts =
    endsAtMs != null && now != null ? getCountdownParts(endsAtMs - now) : null

  return (
    <div
      className="relative z-10 w-full bg-white"
      data-testid="campaign-banner"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2 sm:gap-x-5 sm:px-6">
        <div className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:gap-x-3.5">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-tight whitespace-nowrap text-teal-500">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-teal-500" />
            Flash deal
          </span>
          <span className="truncate text-xs font-medium tracking-tight text-zinc-800 sm:text-sm">
            {headline}
            {code ? (
              <>
                {' · code '}
                <span className="font-semibold tracking-wide">{code}</span>
              </>
            ) : null}
          </span>
          {countdownParts ? (
            <span
              className="inline-flex shrink-0 items-center gap-1.5"
              aria-label={countdownAriaLabel(countdownParts)}
              data-testid="campaign-banner-countdown"
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
                aria-hidden
              >
                Ends in
              </span>
              <span className="flex items-center gap-1" aria-hidden>
                {countdownParts.days > 0 ? (
                  <TimeUnit value={countdownParts.days} unit="d" pad={false} />
                ) : null}
                <TimeUnit value={countdownParts.hours} unit="h" />
                <TimeUnit value={countdownParts.minutes} unit="m" />
                <TimeUnit value={countdownParts.seconds} unit="s" />
              </span>
            </span>
          ) : null}
        </div>

        <Link
          href={withQS(brandHref('/register'))}
          onClick={() =>
            trackCtaClick({
              label: campaign.name,
              location: 'promo_bar',
            })
          }
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-teal-400 px-4 py-1.5 text-xs font-semibold tracking-tight whitespace-nowrap text-black transition-colors hover:bg-teal-300"
        >
          Claim offer →
        </Link>
      </div>
    </div>
  )
}
