import { BrandProvider } from '@/lib/brand'

export const metadata = {
  title: {
    default: 'Vanta Trading — Funded Trading on Hyperliquid',
    template: '%s',
  },
}

export default function VantaLayout({ children }) {
  return (
    <div data-brand="vanta">
      <BrandProvider brand="vanta">
        {children}
      </BrandProvider>
    </div>
  )
}
