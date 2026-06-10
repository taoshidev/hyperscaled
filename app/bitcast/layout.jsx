import { BrandProvider } from '@/lib/brand'

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
      <BrandProvider brand="bitcast">
        {children}
      </BrandProvider>
    </div>
  )
}
