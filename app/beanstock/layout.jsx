import { BrandProvider } from '@/lib/brand'

export const metadata = {
  title: {
    default: 'Beanstock — Funded Trading on Hyperliquid',
    template: '%s',
  },
  icons: {
    icon: [{ url: '/favicon-beanstock.png', type: 'image/png' }],
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
