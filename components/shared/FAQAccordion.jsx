'use client'

import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretDown } from '@phosphor-icons/react'

const spring = { type: 'spring', stiffness: 120, damping: 22 }

function FAQItem({ item, isOpen, onToggle }) {
  const id = useId()
  const headingId = `${id}-heading`
  const panelId = `${id}-panel`

  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        id={headingId}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-start justify-between py-5 text-left gap-4 group focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none rounded-sm"
      >
        <span
          className={`text-sm font-medium leading-snug transition-colors ${
            isOpen
              ? 'text-teal-400'
              : 'text-zinc-200 group-hover:text-white'
          }`}
        >
          {item.question}
        </span>
        <span className="shrink-0 mt-0.5">
          <CaretDown
            size={16}
            weight="bold"
            className={`transition-transform duration-200 ${
              isOpen
                ? 'rotate-180 text-teal-400'
                : 'text-zinc-500 group-hover:text-zinc-300'
            }`}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            style={{ overflow: 'hidden' }}
          >
            <p className="text-sm text-zinc-400 leading-relaxed pb-5 max-w-[68ch]">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQAccordion({ items, grouped = false, sectionIds = false }) {
  const [openId, setOpenId] = useState(null)

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  if (grouped) {
    return (
      <div className="space-y-14">
        {items.map((group) => {
          const id = sectionIds
            ? group.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
            : undefined

          return (
            <div key={group.category} id={id} className={sectionIds ? 'scroll-mt-24' : undefined}>
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                {group.category}
              </h2>
              <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                {group.items.map((item) => (
                  <FAQItem
                    key={item.id}
                    item={item}
                    isOpen={openId === item.id}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
      {items.map((item, i) => {
        const key = item.id || i
        return (
          <FAQItem
            key={key}
            item={item}
            isOpen={openId === key}
            onToggle={() => toggle(key)}
          />
        )
      })}
    </div>
  )
}
