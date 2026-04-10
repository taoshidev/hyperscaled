'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'
import { useBrand, useBrandHref } from '@/lib/brand'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

export default function PartnersCTA() {
  const brand = useBrand()
  const brandHref = useBrandHref()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-32 px-6 border-t border-b border-white/[0.06]">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-12 md:gap-20 items-center"
        >
          {/* Left — headline */}
          <div>
            <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
              For Operators & Institutions
            </span>
            <h2 className="text-3xl md:text-5xl tracking-tighter leading-none font-bold">
              Run your own scaled trading&nbsp;firm.
            </h2>
          </div>

          {/* Right — body + CTA */}
          <div>
            <p className="text-base text-zinc-400 leading-relaxed max-w-[50ch] mb-8">
              {brand.name} lets operators launch a fully branded prop trading business on decentralized
              infrastructure. Set your own pricing. Collect revenue directly. The network handles
              the challenge, enforcement, and&nbsp;payouts.
            </p>
            <Link
              href={brandHref('/partners')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-teal-400 transition-colors min-h-12 group"
            >
              Learn About the Partner Program
              <ArrowRight size={15} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
