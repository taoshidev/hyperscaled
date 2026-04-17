import FAQPage from '@/components/marketing/FAQPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { FAQ_ITEMS } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'FAQ — Jolly Green Investor Scaled Trading Questions',
  description:
    'Common questions about Jolly Green Investor — challenges, payouts, KYC, account scaling, and how the protocol works.',
  ogTitle: 'Jolly Green Investor FAQ — Everything You Need to Know',
  ogDescription:
    'Everything you need to know about Jolly Green Investor. How the challenge works, when you get paid, how scaling works, and what KYC is required.',
  path: '/jollygreen/faq',
  brand: 'jollygreen',
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

export default function JollyGreenFAQ() {
  return (
    <>
      <JsonLd data={buildFaqSchema()} />
      <FAQPage />
    </>
  )
}
