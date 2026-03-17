'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

export default function PartnersCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-8 md:p-12 text-center overflow-hidden"
        >
          {/* Subtle glow */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(0,198,167,0.06), transparent 60%)',
            }}
          />

          <div className="relative">
            <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
              For Operators & Institutions
            </span>
            <h2 className="text-3xl md:text-5xl tracking-tighter leading-none font-bold mb-5 max-w-2xl mx-auto">
              Run your own funded trading&nbsp;firm.
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed max-w-[60ch] mx-auto mb-8">
              Hyperscaled lets operators launch a fully branded prop trading business on decentralized
              infrastructure. Set your own pricing. Collect revenue directly. The network handles
              evaluation, enforcement, and&nbsp;payouts.
            </p>
            <Link
              href="/partners"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-teal-400/30 bg-teal-400/8 text-teal-400 text-sm font-semibold hover:bg-teal-400/15 hover:border-teal-400/50 active:scale-[0.98] transition-[border-color,background-color,transform] duration-200 min-h-11"
            >
              Learn About the Partner Program
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
