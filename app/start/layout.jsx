import Script from 'next/script'
import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'
import { BrandProvider } from '@/lib/brand'

export default function StartLayout({ children }) {
  return (
    <>
      <Script
        src="https://cdn.tolt.io/tolt.js"
        data-tolt="pk_NViW5X1SHRST7w9SGJVkcEwE"
        strategy="afterInteractive"
      />
      <BrandProvider brand="vanta">
        <div className="bg-[#09090b] text-white font-sans min-h-[100dvh] flex flex-col">
          <Nav excludeLinks={['Partners']} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </BrandProvider>
    </>
  )
}
