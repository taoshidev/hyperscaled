import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'
import { JsonLd } from '@/components/shared/JsonLd'

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "HyperFunded",
  url: "https://hyperfunded.co",
  description: "Scaled perp trading on Hyperliquid. One-step challenge, 100% profit split, onchain USDC rewards, and scale up to $2.5M.",
  sameAs: ["https://x.com/hyperfunded_co"],
}

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "HyperFunded",
  url: "https://hyperfunded.co",
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
