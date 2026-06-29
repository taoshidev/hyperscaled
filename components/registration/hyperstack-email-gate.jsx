'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

// Mandatory email capture for the Hyperstack registration flow. Renders a
// blocking overlay with the HubSpot form before the user can reach wallet
// connect. Once the form is submitted (HubSpot postMessage callback) we persist
// a flag so returning visitors aren't re-prompted. Mounted only on the bitcast
// /register page, so no other brand is affected.
const STORAGE_KEY = 'hyperstack_email_captured'
const HS_PORTAL_ID = '51676532'
const HS_FORM_ID = '1b76c44b-0d48-4513-9b98-6e0a99b9ec74'
const HS_REGION = 'na1'

export default function HyperstackEmailGate({ children }) {
  // Default to gated (overlay shown) so the email step is enforced from first
  // paint; the effect below lifts the gate for visitors who already submitted.
  const [captured, setCaptured] = useState(false)

  useEffect(() => {
    let stored = null
    try {
      stored = window.localStorage.getItem(STORAGE_KEY)
    } catch {}
    if (stored === '1') setCaptured(true)
  }, [])

  useEffect(() => {
    if (captured) return
    function onMessage(e) {
      const d = e && e.data
      if (
        d &&
        d.type === 'hsFormCallback' &&
        (d.eventName === 'onFormSubmitted' || d.eventName === 'onFormSubmit')
      ) {
        try {
          window.localStorage.setItem(STORAGE_KEY, '1')
        } catch {}
        setCaptured(true)
      }
    }
    window.addEventListener('message', onMessage)
    // Lock background scroll while the overlay is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('message', onMessage)
      document.body.style.overflow = prevOverflow
    }
  }, [captured])

  return (
    <>
      {children}
      {!captured && (
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
              Add your email to start your Hyperstack Challenge. This is required before connecting your&nbsp;wallet.
            </p>
            <div className="mt-5">
              <Script
                src={`https://js.hsforms.net/forms/embed/${HS_PORTAL_ID}.js`}
                strategy="afterInteractive"
              />
              <div
                className="hs-form-frame"
                data-region={HS_REGION}
                data-form-id={HS_FORM_ID}
                data-portal-id={HS_PORTAL_ID}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
