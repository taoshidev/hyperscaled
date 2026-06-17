import { BrandProvider } from '@/lib/brand'
import Script from 'next/script'

// Hyperstack's own Google Analytics 4 property. The gtag.js library is already
// loaded once globally in the root layout, so we add only a `config` for the
// Hyperstack property here — no second gtag.js loader. This keeps a single
// Google tag per page (per the Hyperstack team's request) and scopes Hyperstack
// analytics to bitcast routes only; no other brand is affected.
const HYPERSTACK_GA_ID = 'G-99S4JR9JYW'

export const metadata = {
  title: {
    default: 'Hyperstack — Scaled Perp Trading on Hyperliquid',
    template: '%s',
  },
  icons: {
    icon: [{ url: '/hyperstack-favicon.svg', type: 'image/svg+xml' }],
  },
}

export default function BitcastLayout({ children }) {
  return (
    <div data-brand="bitcast">
      <Script id="gtag-hyperstack" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${HYPERSTACK_GA_ID}');
        `}
      </Script>
      <BrandProvider brand="bitcast">
        {children}
      </BrandProvider>
    </div>
  )
}
