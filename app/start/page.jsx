import { BridgePage } from '@/components/start/bridge-page'
import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Trading on Hyperliquid: How it Works',
  description:
    "Register for Hyperscaled through Vanta. Trade live on Hyperliquid with your own wallet. Vanta mirrors your performance and pays rewards in USDC — monthly, onchain.",
  ogTitle: 'Trading on Hyperliquid: How it Works — Powered by Hyperscaled',
  ogDescription:
    'Register for a scaled trading account on Hyperliquid. Non-custodial, 100% performance rewards, monthly USDC payouts.',
  path: '/start',
  robots: { index: false, follow: true },
  brand: 'vanta',
})

export default function StartPage() {
  return <BridgePage />
}
