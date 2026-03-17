'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ShieldCheck, LinkSimple, Globe, LockOpen } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: spring },
}

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Non-Custodial',
    desc: 'Your wallet, your keys. No custody transfer — ever.',
  },
  {
    icon: LinkSimple,
    title: 'Onchain Payouts',
    desc: 'USDC direct to your wallet monthly. Fully verifiable.',
  },
  {
    icon: Globe,
    title: 'Permissionless Worldwide',
    desc: 'Open to every trader in every country. No geographic exclusions.',
  },
  {
    icon: LockOpen,
    title: 'Permissionless Cryptographic KYC',
    desc: "Connect your Hyperliquid wallet. Cryptographically sign, that's all we need.",
  },
]

const compareRows = [
  { label: 'Non-Custodial',       hs: 'Yes',        ftmo: 'No',           typical: 'No' },
  { label: 'KYC Required',        hs: 'None',       ftmo: 'Full KYC',     typical: 'Full KYC' },
  { label: 'Profit Split',        hs: '100%',        ftmo: 'Up to 90%',    typical: '70–80%' },
  { label: 'Payout Verification', hs: 'Onchain',    ftmo: 'Centralized',  typical: 'Centralized' },
  { label: 'Max Account',         hs: '$2.5M',      ftmo: '$400K',        typical: '$200K' },
  { label: 'News Trading',        hs: 'Allowed',    ftmo: 'Restricted',   typical: 'Restricted' },
]

const hsBest = ['Yes', 'None', '100%', 'Onchain', '$2.5M', 'Allowed']

export default function Solution() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const tableRef = useRef(null)
  const tableInView = useInView(tableRef, { once: true, margin: '-80px' })

  return (
    <section id="solution" ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">

        {/* Full-width banner tagline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="border-t border-b border-white/[0.06] py-10 mb-16 text-center"
        >
          <p className="text-2xl md:text-4xl font-bold tracking-tighter text-white mb-2">
            Permissionless.{' '}
            <span className="text-teal-400">Open-Source.</span>{' '}
            Onchain.
          </p>
          <p className="text-base text-zinc-400 max-w-[55ch] mx-auto">
            Built to remove hidden rules, opaque payouts, and centralized discretion.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Left — heading + pillars */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={spring}
              className="mb-8"
            >
              <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
                The Hyperscaled Protocol
              </span>
              <h2 className="text-4xl md:text-5xl tracking-tighter leading-none font-bold mb-5">
                Permissionless.<br />No middlemen.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed max-w-[52ch]">
                Hyperscaled mirrors your Hyperliquid trades into a protocol-funded simulated account
                and pays out performance rewards in USDC — onchain, automatically, monthly.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="space-y-4"
            >
              {pillars.map((p) => {
                const Icon = p.icon
                return (
                  <motion.div
                    key={p.title}
                    variants={itemVariants}
                    className="flex items-start gap-4 pl-4 border-l-2 border-teal-400/30 hover:border-teal-400 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-teal-400/8 border border-teal-400/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-400/15 transition-colors">
                      <Icon size={18} className="text-teal-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white mb-0.5">{p.title}</div>
                      <div className="text-sm text-zinc-400">{p.desc}</div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          {/* Right — comparison table */}
          <motion.div
            ref={tableRef}
            initial={{ opacity: 0, x: 24 }}
            animate={tableInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring, delay: 0.15 }}
            className="bg-zinc-900/50 border border-white/[0.06] rounded-2xl overflow-hidden"
          >
            {/* Table header */}
            <div className="grid grid-cols-4 border-b border-white/[0.06]">
              <div className="col-span-1 p-4 text-xs text-zinc-500 font-medium" />
              <div className="p-4 text-center">
                <span className="text-xs font-semibold text-teal-400">Hyperscaled</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-xs text-zinc-400">FTMO</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-xs text-zinc-400">Typical</span>
              </div>
            </div>

            {/* Table rows */}
            {compareRows.map((row, i) => {
              const isHsBest = hsBest.includes(row.hs)
              return (
                <div
                  key={row.label}
                  className={`grid grid-cols-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors ${
                    i % 2 === 0 ? '' : 'bg-white/[0.01]'
                  }`}
                >
                  <div className="col-span-1 p-3.5 text-xs text-zinc-500">{row.label}</div>
                  <div className="p-3.5 text-center">
                    <span className={`text-xs font-semibold ${isHsBest ? 'text-teal-400' : 'text-zinc-300'}`}>
                      {row.hs}
                    </span>
                  </div>
                  <div className="p-3.5 text-center">
                    <span className="text-xs text-zinc-500">{row.ftmo}</span>
                  </div>
                  <div className="p-3.5 text-center">
                    <span className="text-xs text-zinc-500">{row.typical}</span>
                  </div>
                </div>
              )
            })}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
