import { BrandProvider } from '@/lib/brand'
import Script from 'next/script'

export const metadata = {
  title: {
    default: 'Vanta Trading — Scaled Trading on Hyperliquid',
    template: '%s',
  },
}

export default function VantaLayout({ children }) {
  return (
    <div data-brand="vanta">
      {/* Tolt.js — affiliate tracking scoped to .vantatrading.io so cookies
          persist across vantatrading.io, app.vantatrading.io, and hs.vantatrading.io */}
      <Script
        src="https://cdn.tolt.io/tolt.js"
        data-tolt="pk_NViW5X1SHRST7w9SGJVkcEwE"
        strategy="afterInteractive"
      />
      <BrandProvider brand="vanta">
        {children}
      </BrandProvider>
    </div>
  )
}
