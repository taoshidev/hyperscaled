'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, DiscordLogo, Envelope } from '@phosphor-icons/react'
import FAQAccordion from '@/components/shared/FAQAccordion'
import { FAQ_ITEMS } from '@/lib/constants'

/* ───────────────────────────────────────────────
   TOC sections — derived from FAQ_ITEMS categories
   ─────────────────────────────────────────────── */
const TOC_SECTIONS = FAQ_ITEMS.map((group) => ({
  id: group.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''),
  label: group.category,
}))

/* ───────────────────────────────────────────────
   Sticky TOC (desktop sidebar + mobile jump bar)
   Matches Rules page pattern for consistency
   ─────────────────────────────────────────────── */
function TableOfContents({ activeId }) {
  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden lg:block fixed left-[max(1rem,calc((100vw-900px)/2-180px))] top-32 w-[140px]"
        aria-label="FAQ sections"
      >
        <ul className="space-y-1">
          {TOC_SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`block text-xs py-1.5 transition-colors ${
                  activeId === s.id
                    ? 'text-teal-400 font-medium'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile jump bar */}
      <div className="lg:hidden sticky top-16 z-30 bg-[#09090b]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-4 py-2 min-w-max">
            {TOC_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  activeId === s.id
                    ? 'bg-teal-400/10 text-teal-400 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ───────────────────────────────────────────────
   Active section tracker hook
   ─────────────────────────────────────────────── */
function useActiveSection() {
  const [activeId, setActiveId] = useState(TOC_SECTIONS[0]?.id)

  useEffect(() => {
    const ids = TOC_SECTIONS.map((s) => s.id)
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return activeId
}

/* ───────────────────────────────────────────────
   Section 1 — Page Hero
   ─────────────────────────────────────────────── */
function PageHero() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-[800px] mx-auto text-center">
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
          style={{ textWrap: 'balance' }}
        >
          Questions traders actually&nbsp;ask.
        </h1>
        <p
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          Answers for everything you need to know before starting your Hyperscaled&nbsp;Challenge.
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 2 — FAQ Accordion (grouped by category)
   Uses FAQAccordion grouped mode with sectionIds
   for TOC anchor linking
   ─────────────────────────────────────────────── */
function FAQSection() {
  return (
    <section className="px-6 pb-20">
      <div className="max-w-[900px] mx-auto">
        <FAQAccordion items={FAQ_ITEMS} grouped sectionIds />
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 3 — Bottom contact links
   ─────────────────────────────────────────────── */
function ContactSection() {
  return (
    <section className="px-6 pb-24">
      <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
        <a
          href="https://discord.gg/hyperscaledhq"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2"
        >
          <DiscordLogo size={18} weight="fill" />
          Still have questions? Join our Discord
          <ArrowRight size={14} weight="bold" />
        </a>
        <a
          href="mailto:support@hyperscaled.trade"
          className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors inline-flex items-center gap-2"
        >
          <Envelope size={18} />
          Email us
          <ArrowRight size={14} weight="bold" />
        </a>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Page Compose
   ─────────────────────────────────────────────── */
export default function FAQPage() {
  const activeId = useActiveSection()

  return (
    <>
      <PageHero />
      <TableOfContents activeId={activeId} />
      <FAQSection />
      <ContactSection />
    </>
  )
}
