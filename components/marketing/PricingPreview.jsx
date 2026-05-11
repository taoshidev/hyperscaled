'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Star } from '@phosphor-icons/react'
import { PRICING_TIERS, parseTierAccountSize } from '@/lib/constants'
import { useBrand } from '@/lib/brand'
import { trackCtaClick } from '@/lib/analytics'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const TIER_LABELS = { 'free': 'Free', 'tier-1': 'Starter', 'tier-2': 'Tier I', 'tier-3': 'Tier II', 'tier-4': 'Tier III', 'tier-5': 'Tier IV' }

function tierBadge(tier) {
  if (tier.popular) return 'Most Popular'
  if (tier.id === 'free') return 'Only 1,000 Available'
  return null
}

export default function PricingPreview({ tiers = PRICING_TIERS }) {
  const brand = useBrand()
  tiers = brand.pricingTiers || tiers
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

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${tiers.length <= 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-6'} gap-4 xl:gap-3`}>
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.08 }}
              className={`relative flex flex-col items-center p-6 xl:p-4 rounded-2xl border transition-colors ${
                tier.popular || tier.id === 'free'
                  ? 'shiny-border'
                  : 'border-white/[0.08] bg-[#09090b] hover:border-white/[0.12]'
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
              <div className={`text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-1 ${tierBadge(tier) ? 'mt-4' : 'mt-1'}`}>
                {TIER_LABELS[tier.id]}
              </div>

              {/* Account size */}
              <div className="text-lg font-semibold text-white mb-3">{tier.name}</div>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-5">
                <ins className="text-3xl font-bold font-mono no-underline text-white">
                  ${tier.launchPrice}
                </ins>
                {tier.standardPrice && (
                  <del className="text-sm text-zinc-600 font-mono">${tier.standardPrice}</del>
                )}
                <span className="text-xs text-zinc-500 font-medium">USDC</span>
                <span className="sr-only">
                  {tier.standardPrice
                    ? `Launch price ${tier.launchPrice} USDC, was ${tier.standardPrice} USDC`
                    : `${tier.launchPrice} USDC`}
                </span>
              </div>

              <a
                href={(() => {
                  const size = parseTierAccountSize(tier.accountSize)
                  return size ? `/register?tier=${size}` : '/register'
                })()}
                onClick={() => trackCtaClick({ label: tier.cta, location: `pricing_preview:${tier.name || tier.accountSize || 'unknown'}` })}
                className={`w-full flex items-center justify-center gap-1.5 min-h-12 rounded-xl text-sm font-semibold transition-colors ${
                  tier.popular || tier.id === 'free'
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

        {/* WSB Flash Deal pill */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ ...spring, delay: 0.25 }}
          className="flex justify-center mt-6"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white">
            <img src="/wsb-logo.svg" alt="" className="h-8 w-8 -my-1 rounded-sm" />
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">WallStreetBets Flash Deal: 50% Off All Challenges</span>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
