'use client'

import { useEffect, useState } from 'react'

// Snapshots the incoming query string on mount so outbound links can forward
// attribution (UTMs, _gl, _ga, gclid, fbclid, Tolt ?via=/?ref=, etc.) to
// /register and back to vantatrading.io. Returns the leading "?…" or "" —
// safe to concat onto any href.
export function usePreservedQueryString() {
  const [qs, setQs] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const { search } = window.location
    if (search && search !== '?') setQs(search)
  }, [])

  return qs
}

// Parse the preserved query string into a plain object. Handy for building
// GA4 event params (utm_source, utm_medium, etc.) without pulling in a
// URLSearchParams dep elsewhere.
export function parseUtms(qs) {
  if (!qs || typeof URLSearchParams === 'undefined') return {}
  const params = new URLSearchParams(qs.startsWith('?') ? qs.slice(1) : qs)
  const out = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const v = params.get(key)
    if (v) out[key] = v
  }
  return out
}

// Append the preserved query string to a path. If the path already has its
// own query, merge by appending with & (duplicates are fine — GA4 uses the
// first occurrence).
export function withPreservedQuery(href, qs) {
  if (!qs) return href
  const clean = qs.startsWith('?') ? qs.slice(1) : qs
  if (!clean) return href
  const sep = href.includes('?') ? '&' : '?'
  return `${href}${sep}${clean}`
}
