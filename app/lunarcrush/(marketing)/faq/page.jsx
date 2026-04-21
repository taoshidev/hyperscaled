import FAQPage from '@/components/marketing/FAQPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { FAQ_ITEMS } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'FAQ — LunarCrush Scaled Trading Questions',
  description:
    'Answers on challenges, payouts, KYC, account scaling, and how LunarCrush social data is integrated across every Hyperliquid pair.',
  ogTitle: 'LunarCrush FAQ — Scaled Trading Questions Answered',
  ogDescription:
    'Answers on challenges, payouts, KYC, account scaling, and how LunarCrush social data is integrated across every Hyperliquid pair.',
  path: '/lunarcrush/faq',
  brand: 'lunarcrush',
})

function buildFaqSchema() {
  const allItems = FAQ_ITEMS.flatMap((group) => group.items)
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }
}

export default function LunarCrushFAQ() {
  return (
    <>
      <JsonLd data={buildFaqSchema()} />
      <FAQPage />
    </>
  )
}
