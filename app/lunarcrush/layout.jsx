import { BrandProvider } from '@/lib/brand'

export const metadata = {
  title: {
    default: 'LunarCrush — Scaled Trading on Hyperliquid',
    template: '%s',
  },
}

export default function LunarCrushLayout({ children }) {
  return (
    <div data-brand="lunarcrush">
      <BrandProvider brand="lunarcrush">
        {children}
      </BrandProvider>
    </div>
  )
}
