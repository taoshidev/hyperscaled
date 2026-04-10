import HowItWorksPage from '@/components/marketing/HowItWorksPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { getPricingTiers } from '@/lib/pricing'

export const metadata = buildMetadata({
  title: 'How It Works — Hyperscaled Scaled Trading',
  description:
    'See exactly how Hyperscaled works. Connect your wallet, trade on Hyperliquid, pass the challenge, and keep 100% of your monthly USDC payouts.',
  ogTitle: 'How Hyperscaled Works — Trade on Hyperliquid, Get Funded, Keep 100%',
  ogDescription:
    'No API keys. No custody. Register, trade on Hyperliquid, pass the 1-step challenge, and collect 100% of your profits monthly — onchain.',
  path: '/how-it-works',
})

const HOW_TO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to get a scaled trading account on Hyperscaled",
  description:
    "Connect your wallet, trade on Hyperliquid, pass the 1-step challenge, and keep 100% of your USDC payouts.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Register and pay",
      text: "Connect your wallet at app.hyperscaled.trade. Choose a $5K to $100K account. Pay a one-time USDC fee on Base.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Trade on Hyperliquid",
      text: "Trade any perpetual pair on Hyperliquid using your own wallet. No API keys, no separate platform, no custody.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Track your progress",
      text: "Monitor your challenge progress in real time via the Hyperscaled dashboard or Chrome extension. 10% profit target, 5% max drawdown, no time limit.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Pass and get paid",
      text: "Hit the 10% profit target. Receive 100% of your performance rewards in USDC monthly, automatically onchain.",
    },
  ],
}

export default async function HowItWorks() {
  const tiers = await getPricingTiers()
  return (
    <>
      <JsonLd data={HOW_TO_SCHEMA} />
      <HowItWorksPage tiers={tiers} />
    </>
  )
}
