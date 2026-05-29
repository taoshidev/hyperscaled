import FAQPage from '@/components/marketing/FAQPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { FAQ_ITEMS } from '@/lib/constants'
import { getBrandConfig, brandifyText } from '@/lib/brand-config'

const brand = getBrandConfig('bitcast')

export const metadata = buildMetadata({
  title: 'FAQ — HyperFunded Trading Questions',
  description: 'Common questions about HyperFunded challenges, payouts, KYC, account scaling, supported markets, and how the protocol works.',
  ogTitle: 'HyperFunded FAQ — Everything You Need to Know',
  ogDescription: 'Everything you need to know about HyperFunded scaled trading. How the challenge works, when you get paid, how scaling works, and what KYC is required.',
  path: '/bitcast/faq',
  brand: 'bitcast',
})

function buildFaqSchema() {
  const allItems = FAQ_ITEMS.flatMap((group) => group.items)
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allItems.map((item) => {
      // Prefer compliant overrides, then apply the brand compliance safety-net
      const ov = brand.faqOverrides?.[item.id]
      const q = brandifyText(ov?.question ?? item.question, brand)
      const a = brandifyText(ov?.answer ?? item.answer, brand)
      return {
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      }
    }),
  }
}

export default function BitcastFAQ() {
  return (
    <>
      <JsonLd data={buildFaqSchema()} />
      <FAQPage />
    </>
  )
}
