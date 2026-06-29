'use client'

import { useEffect, useRef, useState } from 'react'

// Mandatory email-capture popup for the Hyperstack (bitcast) connect-and-pay
// step. Renders the HubSpot form via the legacy v2 embed (inline markup, so it's
// stylable and exposes the reliable onFormSubmitted callback) inside a branded
// modal. On submit we hand the email back to the registration flow and close.
//
// Mounted only when it should be shown — the parent gates on brand + phase +
// "no email yet", so this component is "open" while mounted.
export default function HyperstackEmailPopup({ portalId, formId, onCaptured }) {
  const createdRef = useRef(false)
  const emailRef = useRef('')
  // Local close flag — guarantees the modal goes away on submit even if the
  // parent is still rendering us (decouples "close" from email validity so the
  // user can never get stuck on the popup).
  const [done, setDone] = useState(false)

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (done) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [done])

  useEffect(() => {
    if (!portalId || !formId) return
    let cancelled = false

    const readEmailFromDom = () => {
      const el = document.querySelector(
        '#hyperstack-email-popup-form input[type="email"], #hyperstack-email-popup-form input[name="email"]',
      )
      return el?.value || ''
    }

    const createForm = () => {
      if (cancelled || createdRef.current || !window.hbspt) return
      const container = document.getElementById('hyperstack-email-popup-form')
      if (!container) return
      createdRef.current = true
      container.innerHTML = ''
      window.hbspt.forms.create({
        cssClass: 'hyperscaled-waitlist-form hyperstack-email-popup-form',
        portalId,
        formId,
        region: 'na1',
        target: '#hyperstack-email-popup-form',
        onFormReady: ($form) => {
          const root = $form?.[0] || $form
          if (!root) return
          const input = root.querySelector('input[type="email"], input[name="email"]')
          if (input) {
            input.placeholder = 'you@example.com'
            input.setAttribute('placeholder', 'you@example.com')
            emailRef.current = input.value || ''
            const sync = (e) => {
              emailRef.current = e.target.value
            }
            input.addEventListener('input', sync)
            input.addEventListener('change', sync)
          }
          const btn = root.querySelector(
            '.hs-button, input[type="submit"], button[type="submit"]',
          )
          if (btn) {
            if (btn.tagName === 'INPUT') btn.value = 'Continue'
            else btn.textContent = 'Continue'
          }
        },
        // Reliable JS callback (unlike the iframe embed's postMessage) — fires
        // after a successful submission, so the modal closes every time.
        onFormSubmitted: () => {
          if (cancelled) return
          onCaptured?.(emailRef.current || readEmailFromDom())
          setDone(true)
        },
      })
    }

    const existing = document.querySelector('script[src*="hsforms.net"]')
    if (window.hbspt) {
      createForm()
    } else if (existing) {
      existing.addEventListener('load', createForm)
    } else {
      const script = document.createElement('script')
      script.src = 'https://js.hsforms.net/forms/v2.js'
      script.async = true
      script.charset = 'utf-8'
      script.onload = () => setTimeout(createForm, 100)
      document.body.appendChild(script)
    }

    return () => {
      cancelled = true
    }
  }, [portalId, formId, onCaptured])

  if (done) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
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
        <div
          id="hyperstack-email-popup-form"
          className="hyperscaled-waitlist-form hyperstack-email-popup-form mt-5"
        />
      </div>
    </div>
  )
}
