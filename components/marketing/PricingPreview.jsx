'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Star } from '@phosphor-icons/react'
import { PRICING_TIERS } from '@/lib/constants'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const TIER_LABELS = { 'tier-1': 'Tier I', 'tier-2': 'Tier II', 'tier-3': 'Tier III', 'tier-4': 'Tier IV', 'tier-5': 'Tier V' }

export default function PricingPreview({ tiers = PRICING_TIERS }) {
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.08 }}
              className={`relative flex flex-col items-center p-6 rounded-2xl border transition-colors ${
                tier.popular
                  ? 'shiny-border'
                  : 'border-white/[0.08] bg-[#09090b] hover:border-white/[0.12]'
              }`}
            >
              {/* Most Popular badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-teal-400 text-[#09090b] text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full">
                    <Star size={12} weight="fill" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Tier label */}
              <div className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-1 mt-1">
                {TIER_LABELS[tier.id]}
              </div>

              {/* Account size */}
              <div className="text-lg font-semibold text-white mb-3">{tier.name}</div>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-5">
                <ins className="text-3xl font-bold font-mono no-underline text-white">
                  ${tier.launchPrice}
                </ins>
                {tier.standardPrice != null && (
                  <del className="text-sm text-zinc-600 font-mono">${tier.standardPrice}</del>
                )}
                <span className="text-xs text-zinc-500 font-medium">USDC</span>
                {tier.standardPrice != null && (
                  <span className="sr-only">
                    Launch price {tier.launchPrice} USDC, was {tier.standardPrice} USDC
                  </span>
                )}
              </div>

              {/* CTA */}
              <a
                href="/register"
                className={`w-full flex items-center justify-center gap-1.5 min-h-12 rounded-xl text-sm font-semibold transition-colors ${
                  tier.popular
                    ? 'shiny-cta px-6 py-3'
                    : 'bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1]'
                }`}
              >
                {tier.cta}
                <ArrowRight size={14} weight="bold" />
              </a>
            </motion.div>
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
