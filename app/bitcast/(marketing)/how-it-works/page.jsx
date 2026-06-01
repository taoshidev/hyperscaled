import HowItWorksPage from '@/components/marketing/HowItWorksPage'
import { buildMetadata } from '@/lib/metadata'
import { JsonLd } from '@/components/shared/JsonLd'
import { PRICING_TIERS } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'How It Works — Hyperstack',
  description: 'See how Hyperstack works. Connect your wallet, trade on Hyperliquid, pass the Challenge, and earn USDC rewards in a simulated scaled account.',
  ogTitle: 'How Hyperstack Works — Trade on Hyperliquid, Get Scaled',
  ogDescription: 'No API keys. No custody. Register, trade on Hyperliquid, pass the 1-step Challenge, and earn USDC rewards in a simulated scaled account.',
  path: '/bitcast/how-it-works',
  brand: 'bitcast',
})

const HOW_TO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to get a simulated scaled trading account on Hyperstack",
  description: "Connect your wallet, trade perps on Hyperliquid, pass the 1-step Challenge, and earn USDC rewards in a simulated scaled account.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Start Your Challenge", text: "Choose your account size from $5K to $100K, pay a one-time USDC fee, and begin your one-step challenge. No subscriptions, no second phase, no time limit." },
    { "@type": "HowToStep", position: 2, name: "Trade Perps on Hyperliquid", text: "Connect your Hyperliquid wallet and trade the way you already do. Same market, same interface, same trading flow. Hyperstack reads your performance in the background." },
    { "@type": "HowToStep", position: 3, name: "Track your progress", text: "Monitor your challenge progress in real time via the dashboard. 10% profit target, 5% max drawdown, no time limit." },
    { "@type": "HowToStep", position: 4, name: "Hit the Target. Get Scaled.", text: "Hit the 10% profit target while staying inside the 5% drawdown rules. Once you pass, your simulated scaled account is activated and you earn performance-based rewards." },
  ],
}

export default function BitcastHowItWorks() {
  return (
    <>
      <JsonLd data={HOW_TO_SCHEMA} />
      <HowItWorksPage tiers={PRICING_TIERS} />
    </>
  )
}
