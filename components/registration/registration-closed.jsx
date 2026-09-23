'use client'

import Link from 'next/link'
import { ArrowUpRight, Warning } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useBrand, useBrandHref } from '@/lib/brand'
import { REGISTRATION_CLOSED_COPY } from '@/lib/sunset'
import VantaTradingLink from '@/components/shared/VantaTradingLink'

// Notion #1560 — replaces the registration flow on every signup route
// (/register on each brand, /miner/[slug], /vanta/start) so inbound links land
// on the closure notice instead of a form or a 404. Copy is verbatim.
//
// `embedded` renders just the notice for routes whose layout already mounts
// the site nav (e.g. /vanta/start). `logoHref` keeps partner brands' logo
// pointing at their own site, as the registration flow did.
export default function RegistrationClosed({ embedded = false, logoHref }) {
  const brand = useBrand()
  const brandHref = useBrandHref()
  const homeHref = brandHref('/')

  if (embedded) {
    return (
      <section className="flex items-center justify-center px-6 pt-32 pb-24">
        <ClosedNotice />
      </section>
    )
  }

  return (
    <main className="min-h-[calc(100dvh_-_var(--site-banner-h,0px))] flex flex-col bg-background text-foreground">
      <nav className="shrink-0 flex items-center justify-between py-4 px-6 w-full max-w-5xl mx-auto">
        <Link
          href={logoHref ?? homeHref}
          data-testid="register-logo-link"
          className="outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
        >
          <img src={brand.logo} alt={brand.name} className="h-7 w-auto" />
        </Link>
        <Link href={homeHref} data-testid="register-exit-link">
          <Button
            variant="outline"
            className="text-sm h-11 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 cursor-pointer"
          >
            Exit
          </Button>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <ClosedNotice />
      </div>
    </main>
  )
}

function ClosedNotice() {
  return (
    <div className="max-w-md w-full mx-auto text-center space-y-5" data-testid="registration-closed">
      <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <Warning size={32} weight="duotone" className="text-amber-500" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight" style={{ textWrap: 'balance' }}>
        {REGISTRATION_CLOSED_COPY.heading}
      </h1>
      <p className="text-sm text-zinc-400 leading-relaxed">
        {REGISTRATION_CLOSED_COPY.body}
      </p>
      <div className="pt-2">
        <VantaTradingLink
          label={REGISTRATION_CLOSED_COPY.cta}
          location="registration_closed"
          data-testid="registration-closed-cta"
          className="shiny-cta inline-flex items-center px-6 py-3 min-h-12"
        >
          <span className="flex items-center gap-1.5">
            {REGISTRATION_CLOSED_COPY.cta}
            <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
          </span>
        </VantaTradingLink>
      </div>
    </div>
  )
}
