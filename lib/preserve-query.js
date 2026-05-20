'use client'

import { useSyncExternalStore } from 'react'

// useSyncExternalStore avoids SSR mismatch; search only changes on full nav.
function subscribe() {
  return () => {}
}

function getClientSearch() {
  return typeof window !== 'undefined' ? window.location.search : ''
}

function getServerSearch() {
  return ''
}

// Returns leading "?…" or "" — safe to concat onto any href.
export function usePreservedQueryString() {
  const search = useSyncExternalStore(subscribe, getClientSearch, getServerSearch)
  return search && search !== '?' ? search : ''
}

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

export function withPreservedQuery(href, qs) {
  if (!qs) return href
  const clean = qs.startsWith('?') ? qs.slice(1) : qs
  if (!clean) return href
  const sep = href.includes('?') ? '&' : '?'
  return `${href}${sep}${clean}`
}

// For marketing CTAs that point at /register: forwards attribution + promo + UTMs.
export function useWithPreservedQuery() {
  const qs = usePreservedQueryString()
  return (href) => withPreservedQuery(href, qs)
}
