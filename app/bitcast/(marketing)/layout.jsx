import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'
import { JsonLd } from '@/components/shared/JsonLd'

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hyperstack",
  url: "https://hyperstack.trade",
  description: "Simulated scaled perp trading evaluation on Hyperliquid. One-step Challenge, USDC rewards, and scale up to $400K. An Authorized Marketing Partner of Vanta.",
  sameAs: ["https://x.com/hyperstack_trade"],
}

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Hyperstack",
  url: "https://hyperstack.trade",
}

export default function BitcastMarketingLayout({ children }) {
  return (
    <div className="bg-black text-white font-sans min-h-[100dvh]">
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <JsonLd data={WEBSITE_SCHEMA} />
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
