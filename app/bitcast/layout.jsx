import { BrandProvider } from '@/lib/brand'

export const metadata = {
  title: {
    default: 'HyperFunded — Scaled Perp Trading on Hyperliquid',
    template: '%s',
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
