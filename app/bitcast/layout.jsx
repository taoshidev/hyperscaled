import { BrandProvider } from '@/lib/brand'

export const metadata = {
  title: {
    default: 'Bitcast — Scaled Trading on Hyperliquid',
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
