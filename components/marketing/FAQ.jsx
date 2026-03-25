'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Plus, Minus } from '@phosphor-icons/react'
import Link from 'next/link'
import { FAQ_ITEMS, HOME_FAQ_IDS } from '@/lib/constants'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

const allItems = FAQ_ITEMS.flatMap((cat) => cat.items)
const faqs = HOME_FAQ_IDS.map((id) => allItems.find((item) => item.id === id)).filter(Boolean).map((item) => ({
  q: item.question,
  a: item.answer,
}))

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay: index * 0.06 }}
      className="border-b border-white/[0.06] last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-5 text-left gap-4 group"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors leading-snug">
          {item.q}
        </span>
        <span className="shrink-0 mt-0.5">
          {open ? (
            <Minus size={16} className="text-teal-400" />
          ) : (
            <Plus size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            style={{ overflow: 'hidden' }}
          >
            <p className="text-sm text-zinc-400 leading-relaxed pb-5 max-w-[68ch]">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="faq" ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Left — sticky headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={spring}
            className="md:sticky md:top-28"
          >
            <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl tracking-tighter leading-none font-bold mb-5 text-balance">
              Questions traders actually ask.
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed max-w-[46ch] [text-wrap:pretty]">
              No fine print, no vague answers. If something isn&apos;t clear here, it&apos;s spelled
              out in the open-source protocol rules.
            </p>

            <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] space-y-2">
              <div className="text-xs text-zinc-500">Still have questions?</div>
              <a
                href="https://discord.com/invite/GsqbQHu5UD"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium block"
              >
                Join our Discord →
              </a>
              <Link
                href="/faq"
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors font-medium block"
              >
                View full FAQ →
              </Link>
            </div>
          </motion.div>

          {/* Right — accordion */}
          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {faqs.map((item, i) => (
              <FAQItem key={item.q} item={item} index={i} />
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
