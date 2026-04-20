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
        src="https://files.tlt-cdn.com/tlt.js"
        data-tolt="pk_NViW5X1SHRST7w9SGJVkcEwE"
        strategy="afterInteractive"
      />
      <Script id="tolt-init" strategy="afterInteractive">{`
        window.addEventListener('load', function() {
          if (window.tolt) {
            tolt.init('pk_NViW5X1SHRST7w9SGJVkcEwE', {
              cookieDomain: '.vantatrading.io'
            });
          }
        });
      `}</Script>
      <BrandProvider brand="vanta">
        {children}
      </BrandProvider>
    </div>
  )
}
