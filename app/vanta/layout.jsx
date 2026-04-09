import { headers } from 'next/headers'
import { BrandProvider } from '@/lib/brand'

const ROOT_VANTA_HOSTNAMES = new Set([
  'hs.vantatrading.io',
  'vantatrading.io',
  'www.vantatrading.io',
])

export const metadata = {
  title: {
    default: 'Vanta Trading — Funded Trading on Hyperliquid',
    template: '%s',
  },
}

export default async function VantaLayout({ children }) {
  const headerStore = await headers()
  const host = (headerStore.get('x-forwarded-host') || headerStore.get('host') || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
  const prefixOverride = ROOT_VANTA_HOSTNAMES.has(host) ? '' : '/vanta'

  return (
    <div data-brand="vanta">
      <BrandProvider brand="vanta" prefixOverride={prefixOverride}>
        {children}
      </BrandProvider>
    </div>
  )
}
