'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Warning } from '@phosphor-icons/react'

export default function WaitlistForm({ className = '', inputClass = '', btnLabel = 'Get Funded' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error')
      setErrorMsg('Enter a valid email address.')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      // Simulated — replace with real endpoint
      await new Promise((res) => setTimeout(res, 1500))
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Try again.')
    }
  }

  const isDisabled = status === 'loading' || status === 'success'

  return (
    <div className={className}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3"
        id="get-funded"
      >
        {/* Email input */}
        <div className="relative flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (status === 'error') setStatus('idle')
            }}
            placeholder="your@email.com"
            disabled={isDisabled}
            className={`w-full px-4 py-3 rounded-xl text-sm bg-zinc-900 border outline-none
              text-white placeholder-zinc-600 transition-all
              focus:ring-1 focus:ring-teal-400/20
              disabled:opacity-50 disabled:cursor-not-allowed
              ${status === 'error'
                ? 'border-red-400/60 focus:border-red-400/60'
                : 'border-white/[0.08] hover:border-white/[0.16] focus:border-teal-400/60'
              }
              ${inputClass}
            `}
          />
          {/* Skeleton shimmer overlay when loading */}
          {status === 'loading' && (
            <div className="absolute inset-0 rounded-xl skeleton pointer-events-none" />
          )}
        </div>

        {/* Submit button */}
        {status === 'success' ? (
          <div className="px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap bg-teal-400/10 text-teal-400 border border-teal-400/30 flex items-center gap-2">
            <CheckCircle size={16} weight="bold" />
            You&apos;re in
          </div>
        ) : status === 'loading' ? (
          <button
            type="submit"
            disabled
            className="px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap bg-zinc-800 text-zinc-500 border border-white/[0.06] cursor-not-allowed"
          >
            Joining...
          </button>
        ) : (
          <button
            type="submit"
            className="shiny-cta px-6 py-3 whitespace-nowrap"
          >
            <span>{btnLabel}</span>
          </button>
        )}
      </form>

      {/* Error message */}
      <AnimatePresence>
        {status === 'error' && errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="text-xs text-red-400 mt-2.5 flex items-center gap-1.5"
          >
            <Warning size={13} weight="bold" />
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
