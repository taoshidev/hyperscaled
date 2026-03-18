'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, TrendUp, ArrowsClockwise } from '@phosphor-icons/react'
import LiquidCrystalBg from './LiquidCrystalBg'
import { HERO_STATS } from '@/lib/constants'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring },
}

const cardVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { ...spring, delay: 0.3 } },
}

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden pt-16">
      {/* Liquid crystal shader background */}
      <LiquidCrystalBg className="pointer-events-none" />
      <div className="absolute inset-0 bg-zinc-950/60 pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-6 w-full py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-center">

          {/* Left column */}
          <motion.div
            className="lg:col-span-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow */}
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-400/20 bg-teal-400/8 text-xs text-teal-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-teal" />
                Built on Hyperliquid · Powered by Bittensor
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-6xl xl:text-7xl tracking-tighter leading-none font-bold mb-6"
            >
              Permissionless{' '}
              <span className="text-teal-400">Funded Trading</span>{' '}
              on Hyperliquid
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={itemVariants}
              className="text-base text-zinc-400 leading-relaxed max-w-[56ch] mb-8"
            >
              Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to&nbsp;$2.5M. Built on the most advanced decentralized prop trading infrastructure in the&nbsp;world.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                href="/register"
                className="shiny-cta px-6 py-3 whitespace-nowrap"
              >
                <span className="flex items-center gap-1.5">
                  Start Your Evaluation
                  <ArrowRight size={15} weight="bold" />
                </span>
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.12] text-white text-sm font-medium hover:border-white/[0.24] hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-teal-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] transition-[border-color,background-color,transform] duration-200"
              >
                Learn More
                <ArrowRight size={15} weight="bold" />
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-8 pt-8 border-t border-white/[0.06]"
            >
              {HERO_STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-bold tracking-tight text-white">{s.value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column — Dashboard card */}
          <motion.div
            className="lg:col-span-2"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <div
              className="relative bg-zinc-900/70 rounded-2xl border border-white/[0.08] p-5 backdrop-blur-sm"
              style={{
                boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,198,167,0.06)',
              }}
            >
              {/* Card inner glow */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 80% 20%, rgba(0,198,167,0.07), transparent 55%)',
                }}
              />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-400">Funded Account</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-400/10 border border-teal-400/20 text-xs text-teal-400 font-medium">
                    <span className="w-1 h-1 rounded-full bg-teal-400 pulse-teal" />
                    Live
                  </span>
                </div>
                <div className="text-xs text-zinc-600 font-mono">7d cycle</div>
              </div>

              {/* Balance */}
              <div className="mb-4">
                <div className="text-xs text-zinc-500 mb-1">Account Balance</div>
                <div className="text-3xl font-bold tracking-tight text-teal-400">$201,271.23</div>
              </div>

              {/* Payout */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                <span className="text-xs text-zinc-400">Current Period Expected Payout</span>
                <span className="text-sm font-semibold text-white">+$1,271.23</span>
              </div>

              {/* Open position */}
              <div className="mb-4">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Open Positions</div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white font-mono">BTC-PERP</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-teal-400/10 text-teal-400 border border-teal-400/20">LONG</span>
                    </div>
                    <span className="text-xs font-semibold text-white">+$234.50</span>
                  </div>
                  <div className="grid grid-cols-3 gap-x-3 text-xs text-zinc-500 font-mono">
                    <div>
                      <span className="block text-zinc-600">Size</span>
                      <span className="text-zinc-300">0.15 BTC</span>
                    </div>
                    <div>
                      <span className="block text-zinc-600">Entry</span>
                      <span className="text-zinc-300">$98,450</span>
                    </div>
                    <div>
                      <span className="block text-zinc-600">Mark · Lev</span>
                      <span className="text-zinc-300">$100,013 · 5×</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promotions */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-teal-400/5 border border-teal-400/10">
                <TrendUp size={14} className="text-teal-400 shrink-0" />
                <div className="text-xs text-zinc-400 leading-tight">
                  <span className="text-teal-400 font-semibold">+$100,000</span> All Time Returns · Sharpe{' '}
                  <span className="text-white">9.32%</span> / 1.23
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-zinc-500">Quarterly Promotion Progress</span>
                    <span className="text-xs font-mono text-zinc-400">2% / 5%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-1.5 rounded-full bg-teal-400 w-[40%]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-zinc-500">Current Drawdown</span>
                    <span className="text-xs font-mono text-amber-400">7.2% / 10%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-1.5 rounded-full w-[72%]"
                      style={{ background: 'linear-gradient(90deg, #F59E0B, #D97706)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer link */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <ArrowsClockwise size={11} />
                  Updated just now
                </div>
                <a href="#" className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1">
                  View Full Analytics
                  <ArrowRight size={10} />
                </a>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
