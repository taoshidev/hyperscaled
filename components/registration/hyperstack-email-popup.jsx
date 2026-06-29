'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { isValidEmail } from '@/lib/validation'

// Mandatory email-capture popup for the Hyperstack (bitcast) connect-and-pay
// step. We render our own on-brand field rather than embedding HubSpot's form
// iframe (their form is unstyleable from outside and overflows the modal), and
// submit the lead to Hyperstack's HubSpot via the Forms API — the same endpoint
// the connect step already uses. On submit we hand the email to the registration
// flow and close immediately.
//
// Mounted only while it should show — the parent gates on brand + phase + "no
// email yet", so this is "open" whenever it's mounted.
export default function HyperstackEmailPopup({ portalId, formId, onCaptured }) {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState(false)
  const valid = isValidEmail(value)
  const showError = touched && !valid

  // Lock background scroll while the modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    // Route the lead to Hyperstack's HubSpot (fire-and-forget; never blocks the
    // funnel if HubSpot is slow / blocked).
    if (portalId && formId) {
      fetch(
        `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: [{ name: 'email', value }],
            context: {
              pageUri: window.location.href,
              pageName: document.title,
            },
          }),
        },
      ).catch(() => {})
    }
    onCaptured?.(value)
    setDone(true)
  }

  if (done) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-sm px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label="Enter your email to continue"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Enter your email to continue
        </h2>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Add your email to start your Hyperstack Challenge — we&apos;ll send your registration confirmation and account updates&nbsp;here.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="hyperstack-popup-email" className="block text-xs font-medium text-zinc-400">
              Email address <span className="text-red-400">*</span>
            </label>
            <input
              id="hyperstack-popup-email"
              type="email"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="you@example.com"
              aria-invalid={showError ? 'true' : undefined}
              className={`w-full rounded-xl border bg-[#141416] p-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0c0e] ${
                showError ? 'border-red-400' : 'border-white/[0.1] hover:border-white/[0.2]'
              }`}
            />
            <div className="min-h-[1.1rem]">
              {showError && (
                <p className="text-xs text-red-400">
                  {value.length === 0 ? 'Email address is required' : 'Enter a valid email address'}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-400 px-6 py-3 text-sm font-semibold text-[#09090b] transition-opacity hover:opacity-90"
          >
            Continue
            <ArrowRight size={14} weight="bold" />
          </button>
        </form>
      </div>
    </div>
  )
}
