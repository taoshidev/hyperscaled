'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Star } from '@phosphor-icons/react'
import { PRICING_TIERS } from '@/lib/constants'
import { useBrandHref } from '@/lib/brand'
import { trackCtaClick } from '@/lib/analytics'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const TIER_LABELS = { 'free': 'Free', 'tier-1': 'Starter', 'tier-2': 'Tier I', 'tier-3': 'Tier II', 'tier-4': 'Tier III', 'tier-5': 'Tier IV' }

function tierBadge(tier) {
  if (tier.popular) return 'Most Popular'
  if (tier.id === 'free') return 'Try for Free'
  return null
}

function PricingCard({ tier, index, brandHref }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const details = [
    { label: 'Profit Target', value: tier.profitTargetAmount },
    { label: 'Max Drawdown', value: `${tier.maxDrawdownAmount} limit` },
    { label: 'Scaling', value: tier.scalingPath },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay: index * 0.1 }}
      className={`relative flex flex-col rounded-2xl p-6 sm:p-8 xl:p-4 ${
        tier.popular || tier.id === 'free'
          ? 'shiny-border'
          : 'border border-white/[0.08] bg-[#09090b]'
      }`}
    >
      {/* Badge — Most Popular or Try for Free */}
      {tierBadge(tier) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-teal-400 text-[#09090b] text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full">
            <Star size={12} weight="fill" />
            {tierBadge(tier)}
          </span>
        </div>
      )}

      {/* Tier label */}
      <div className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mt-2 mb-1">
        {TIER_LABELS[tier.id]}
      </div>

      {/* Tier name */}
      <h3 className="text-lg font-semibold">{tier.name}</h3>

      {/* Pricing */}
      <div className="mt-4 flex items-baseline gap-2">
        <ins className="text-3xl sm:text-4xl xl:text-3xl font-bold font-mono no-underline text-white">
          ${tier.launchPrice}
        </ins>
        <span className="text-xs text-zinc-500 font-medium">USDC</span>
      </div>

      {/* Details */}
      <ul className="mt-6 xl:mt-4 space-y-3 xl:space-y-2 flex-1">
        {details.map((d) => (
          <li key={d.label} className="flex items-start justify-between gap-4 xl:gap-2 text-sm xl:text-xs">
            <span className="text-zinc-500">{d.label}</span>
            <span className="text-right font-medium font-mono text-zinc-200">{d.value}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={brandHref('/register')}
        onClick={() => trackCtaClick({ label: tier.cta, location: `home_pricing:${tier.name || tier.accountSize || 'unknown'}` })}
        className={`mt-8 xl:mt-4 flex items-center justify-center gap-1.5 min-h-12 xl:min-h-10 rounded-xl text-sm xl:text-xs font-semibold transition-colors ${
          tier.popular || tier.id === 'free'
            ? 'shiny-cta px-6 py-3 xl:px-3 xl:py-2'
            : 'bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1]'
        }`}
      >
        {tier.cta}
        <ArrowRight size={14} weight="bold" />
      </Link>
    </motion.div>
  )
}

export default function HomePricing({ tiers = PRICING_TIERS }) {
  const brandHref = useBrandHref()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="text-center mb-10"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl tracking-tighter leading-none font-bold">
            Choose your account&nbsp;size.
          </h2>
          <div className="mt-5 flex justify-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-teal-400/20 bg-teal-400/10 text-xs text-teal-400 font-medium">
              90+ tradeable&nbsp;pairs
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 md:gap-5 xl:gap-3">
          {tiers.map((tier, i) => (
            <PricingCard key={tier.id} tier={tier} index={i} brandHref={brandHref} />
          ))}
        </div>

        {/* Universal rules */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ ...spring, delay: 0.3 }}
          className="text-center text-sm text-zinc-500 mt-8 max-w-[60ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          All tiers: 10% profit target · 5% max drawdown · 100% profit split · Monthly payouts · No time&nbsp;limit
        </motion.p>
      </div>
    </section>
  )
}
