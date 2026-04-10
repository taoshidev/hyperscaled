import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'
import { JsonLd } from '@/components/shared/JsonLd'

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hyperscaled",
  url: "https://vantatrading.io",
  logo: "https://vantatrading.io/vanta-logo.svg",
  description:
    "Decentralized prop trading network built on Hyperliquid. 1-step challenge, 100% profit split, onchain USDC payouts. Powered by Hyperscaled.",
  sameAs: [
    "https://x.com/vantatrading",
    "https://discord.gg/vantatrading",
  ],
}

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Hyperscaled",
  url: "https://vantatrading.io",
}

export default function VantaMarketingLayout({ children }) {
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
