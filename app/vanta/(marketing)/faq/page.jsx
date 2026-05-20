import FAQPage from '@/components/marketing/FAQPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { FAQ_ITEMS } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'FAQ — Vanta Trading Scaled Trading Questions',
  description:
    'Common questions about Vanta Trading — challenges, payouts, KYC, account scaling, and how the protocol works.',
  ogTitle: 'Vanta Trading FAQ — Everything You Need to Know',
  ogDescription:
    'Everything you need to know about Vanta Trading. How the challenge works, when you get paid, how scaling works, and what KYC is required.',
  path: '/vanta/faq',
  brand: 'vanta',
})

function buildFaqSchema() {
  const allItems = FAQ_ITEMS.flatMap((group) => group.items)
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}

export default function VantaFAQ() {
  return (
    <>
      <JsonLd data={buildFaqSchema()} />
      <FAQPage />
    </>
  )
}
