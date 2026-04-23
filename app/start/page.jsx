import Script from 'next/script'
import { BridgePage } from '@/components/start/bridge-page'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: "Here's how Hyperscaled works",
  description:
    "Trade live on Hyperliquid with your own wallet. Vanta's infrastructure mirrors your performance to a simulated scaled account and pays rewards in USDC — monthly, onchain.",
  ogTitle: 'Start trading with Vanta — Powered by Hyperscaled',
  ogDescription:
    'Register for a scaled trading account on Hyperliquid. Non-custodial, 100% performance rewards, monthly USDC payouts.',
  path: '/start',
  robots: { index: false, follow: true },
  brand: 'vanta',
})

export default function StartPage() {
  return (
    <>
      <Script
        src="https://cdn.tolt.io/tolt.js"
        data-tolt="pk_NViW5X1SHRST7w9SGJVkcEwE"
        strategy="afterInteractive"
      />
      <BridgePage />
    </>
  )
}
