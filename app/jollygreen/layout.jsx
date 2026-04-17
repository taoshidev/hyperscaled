import { BrandProvider } from '@/lib/brand'

export const metadata = {
  title: {
    default: 'Jolly Green Investor — Scaled Trading on Hyperliquid',
    template: '%s',
  },
}

export default function JollyGreenLayout({ children }) {
  return (
    <div data-brand="jollygreen">
      <BrandProvider brand="jollygreen">
        {children}
      </BrandProvider>
    </div>
  )
}
