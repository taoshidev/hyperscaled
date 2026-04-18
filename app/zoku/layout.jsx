import { BrandProvider } from '@/lib/brand'

export const metadata = {
  title: {
    default: 'Zoku — Scaled Trading on Hyperliquid',
    template: '%s',
  },
}

export default function ZokuLayout({ children }) {
  return (
    <div data-brand="zoku">
      <BrandProvider brand="zoku">
        {children}
      </BrandProvider>
    </div>
  )
}
