import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'
import { JsonLd } from '@/components/shared/JsonLd'

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Beanstock",
  url: "https://beanstockinvestor.com",
  logo: "https://beanstockinvestor.com/beanstock-logo.svg",
  description:
    "Decentralized prop trading network built on Hyperliquid. 1-step challenge, 100% profit split, onchain USDC payouts.",
  sameAs: [
    "https://x.com/beanstockmoney",
    "https://discord.com/invite/wSC49Gtjsy",
  ],
}

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Beanstock",
  url: "https://beanstockinvestor.com",
}

export default function BeanstockMarketingLayout({ children }) {
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
