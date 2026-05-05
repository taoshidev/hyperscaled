import { BrandProvider } from '@/lib/brand'

export const metadata = {
  title: {
    default: 'Beanstock — Scaled Trading on Hyperliquid',
    template: '%s',
  },
}

export default function BeanstockLayout({ children }) {
  return (
    <div data-brand="beanstock">
      <BrandProvider brand="beanstock">
        {children}
      </BrandProvider>
    </div>
  )
}
