import { BrandProvider } from '@/lib/brand'

export const metadata = {
  title: {
    default: 'HyperFunded — Scaled Perp Trading on Hyperliquid',
    template: '%s',
  },
  icons: {
    icon: [{ url: '/hyperfunded-favicon.png', type: 'image/png' }],
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
