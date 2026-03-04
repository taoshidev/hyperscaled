'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import WaitlistForm from './WaitlistForm'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const traders = [
  { name: 'Kira Nakashima', handle: '0xKira' },
  { name: 'Emeka Adeyemi', handle: 'perpetualemeka' },
  { name: 'Soren Lindqvist', handle: 'sorenliq' },
  { name: 'Yael Cohen', handle: 'driftcohen' },
  { name: 'Marcus Osei', handle: 'w4vezero' },
]

export default function CTABanner() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-32 px-6 overflow-hidden">
      {/* Teal radial glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: 900,
            height: 600,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse, rgba(0,198,167,0.12) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            left: '20%',
            bottom: '10%',
            background: 'radial-gradient(circle, rgba(0,198,167,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />

      <div className="relative max-w-[1400px] mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={spring}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-400/20 bg-teal-400/8 text-xs text-teal-400 font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-teal" />
              Waitlist Open
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.08 }}
            className="text-4xl md:text-6xl tracking-tighter leading-none font-bold mb-6"
          >
            47.2% of funded traders earned back their eval fee{' '}
            <span className="text-teal-400">in 3 weeks.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.14 }}
            className="text-base text-zinc-400 leading-relaxed max-w-[52ch] mx-auto mb-10"
          >
            Join 4,200+ traders who trade with protocol-backed capital, onchain payouts, and zero KYC.
            No middlemen. No hidden rules. Just performance.
          </motion.p>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.2 }}
            className="flex justify-center mb-10"
          >
            <WaitlistForm className="w-full max-w-md" btnLabel="Get Funded" />
          </motion.div>

          {/* Avatar stack */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ ...spring, delay: 0.28 }}
            className="flex items-center justify-center gap-3"
          >
            <div className="flex -space-x-2.5">
              {traders.map((t) => (
                <img
                  key={t.handle}
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random&color=fff&size=48&bold=true`}
                  alt={t.handle}
                  className="w-8 h-8 rounded-full border-2 border-[#09090b]"
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500">
              <span className="text-zinc-300 font-medium">4,200+</span> traders already on the network
            </span>
          </motion.div>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </section>
  )
}
