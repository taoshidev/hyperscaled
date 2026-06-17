'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const spring = { type: 'spring', stiffness: 100, damping: 20 }

// Homepage video section. Rendered only for brands that define `brand.homeVideo`
// ({ id, title }) — currently Hyperstack (bitcast). Uses the privacy-enhanced
// youtube-nocookie domain and a lazy iframe so it doesn't cost the initial load.
export default function VideoSection({ video }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  if (!video?.id) return null

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-[900px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="text-3xl md:text-4xl tracking-tighter leading-none font-bold text-center mb-10"
        >
          {video.title}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.1 }}
          className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] bg-black"
        >
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.id}`}
            title={video.title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </motion.div>
      </div>
    </section>
  )
}
