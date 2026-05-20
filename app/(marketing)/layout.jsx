import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'
import { JsonLd } from '@/components/shared/JsonLd'

const BASE_URL = process.env.HYPERSCALED_BASE_URL || "https://hyperscaled.trade";

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hyperscaled",
  url: BASE_URL,
  logo: `${BASE_URL}/hyperscaled-logo.svg`,
  description:
    "Decentralized prop trading network built on Hyperliquid. 1-step challenge, 100% profit split, onchain USDC payouts.",
  sameAs: [
    "https://x.com/hyperscaledhq",
    "https://discord.gg/hyperscaledhq",
    "https://github.com/taoshidev",
  ],
}

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Hyperscaled",
  url: BASE_URL,
}

export default function MarketingLayout({ children }) {
  return (
    <div className="bg-[#09090b] text-white font-sans min-h-[100dvh]">
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
