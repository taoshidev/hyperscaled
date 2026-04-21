import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'
import { JsonLd } from '@/components/shared/JsonLd'

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LunarCrush",
  url: "https://lunarcrush.com",
  description:
    "Scaled trading on Hyperliquid with live LunarCrush social intelligence. 1-step challenge, 100% profit split, onchain USDC payouts.",
  sameAs: [
    "https://x.com/LunarCrush",
    "https://t.me/lunarcrush",
    "https://youtube.com/@LunarCrush",
    "https://github.com/lunarcrush",
  ],
}

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LunarCrush Scaled",
  url: "https://lunarcrush.com",
}

export default function LunarCrushMarketingLayout({ children }) {
  return (
    <div className="bg-black text-white font-sans min-h-[100dvh]">
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <JsonLd data={WEBSITE_SCHEMA} />
      <Nav />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  )
}
