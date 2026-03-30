'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderOpen, PuzzlePiece, ToggleRight, TelegramLogo, ArrowRight } from '@phosphor-icons/react'

const STEPS = [
  {
    icon: FolderOpen,
    title: 'Unzip the folder',
    body: "Find the downloaded file and unzip it. You'll get a folder called hyperscaled_extension.",
  },
  {
    icon: ToggleRight,
    title: 'Enable Developer Mode',
    body: (
      <>
        Open Chrome and go to{' '}
        <code className="text-teal-400 bg-teal-400/10 rounded px-1.5 py-0.5 text-xs font-mono">
          chrome://extensions
        </code>
        . Toggle <strong className="text-white font-medium">Developer mode</strong> on in the top-right corner.
      </>
    ),
  },
  {
    icon: PuzzlePiece,
    title: 'Load unpacked extension',
    body: 'Click "Load unpacked", then select the unzipped hyperscaled_extension folder. The extension will appear in your toolbar.',
  },
]

export default function ExtensionModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg bg-[#0f0f11] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-lg font-semibold text-white leading-tight">
                    Install the Extension
                  </h2>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    Load it manually — takes about 30 seconds.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Steps */}
              <div className="px-6 py-5 flex flex-col gap-4">

                {/* Testnet notice */}
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-400/[0.07] border border-amber-400/20">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30 mt-1.5" />
                  <p className="text-xs text-amber-200/70 leading-relaxed">
                    Manual installation is only required during the <span className="text-amber-300 font-medium">testnet period</span>. Once Hyperscaled launches on mainnet, the extension will be available directly from the Chrome Web Store — no manual steps needed.
                  </p>
                </div>
                {STEPS.map((step, i) => {
                  const Icon = step.icon
                  return (
                    <div key={i} className="flex gap-3.5">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-teal-400/10 border border-teal-400/20 flex items-center justify-center">
                        <Icon size={16} weight="bold" className="text-teal-400" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium text-white leading-snug">
                          <span className="text-zinc-500 mr-1.5">{i + 1}.</span>
                          {step.title}
                        </p>
                        <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row items-center gap-3 border-t border-white/[0.06]">
                <a
                  href="https://t.me/hyperscaled_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/25 text-[#229ED9] hover:bg-[#229ED9]/20 transition-colors text-sm font-medium"
                >
                  <TelegramLogo size={16} weight="fill" />
                  Use Telegram Bot Instead
                </a>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-400/10 border border-teal-400/20 text-teal-400 hover:bg-teal-400/20 transition-colors text-sm font-medium"
                >
                  Got it
                  <ArrowRight size={14} weight="bold" />
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
