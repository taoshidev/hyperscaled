'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Star } from '@phosphor-icons/react'
import { PRICING_TIERS } from '@/lib/constants'
import { useBrandHref } from '@/lib/brand'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const TIER_LABELS = { 'tier-1': 'Tier I', 'tier-2': 'Tier II', 'tier-3': 'Tier III', 'tier-4': 'Tier IV', 'tier-5': 'Tier V' }

function PricingCard({ tier, index, brandHref }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const details = [
    { label: 'Account Size', value: tier.accountSize },
    { label: 'Profit Target', value: `${tier.profitTarget} (${tier.profitTargetAmount} target)` },
    { label: 'Max Drawdown', value: `${tier.maxDrawdown} (${tier.maxDrawdownAmount} limit)` },
    { label: 'Profit Split', value: tier.profitSplit },
    { label: 'Payout Cycle', value: tier.payoutCycle },
    { label: 'Scaling Path', value: tier.scalingPath },
    { label: 'Time Limit', value: tier.timeLimit },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay: index * 0.1 }}
      className={`relative flex flex-col rounded-2xl p-6 sm:p-8 ${
        tier.popular
          ? 'shiny-border'
          : 'border border-white/[0.08] bg-[#09090b]'
      }`}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-teal-400 text-[#09090b] text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full">
            <Star size={12} weight="fill" />
            Most Popular
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
        <ins className="text-3xl sm:text-4xl font-bold font-mono no-underline text-white">
          ${tier.launchPrice}
        </ins>
        <del className="text-sm text-zinc-600 font-mono">${tier.standardPrice}</del>
        <span className="text-xs text-zinc-500 font-medium">USDC</span>
        <span className="sr-only">
          Launch price {tier.launchPrice} USDC, was {tier.standardPrice} USDC
        </span>
      </div>

      {/* Details */}
      <ul className="mt-6 space-y-3 flex-1">
        {details.map((d) => (
          <li key={d.label} className="flex items-start justify-between gap-4 text-sm">
            <span className="text-zinc-500">{d.label}</span>
            <span className="text-right font-medium font-mono text-zinc-200">{d.value}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={brandHref('/register')}
        className={`mt-8 flex items-center justify-center gap-1.5 min-h-12 rounded-xl text-sm font-semibold transition-colors ${
          tier.popular
            ? 'shiny-cta px-6 py-3'
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
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-5">
          {tiers.map((tier, i) => (
            <PricingCard key={tier.id} tier={tier} index={i} brandHref={brandHref} />
          ))}
        </div>

        {/* Launch pricing note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ ...spring, delay: 0.3 }}
          className="text-center text-xs text-zinc-500 mt-6"
        >
          Launch pricing active. Limited-time&nbsp;pricing.
        </motion.p>
      </div>
    </section>
  )
}
