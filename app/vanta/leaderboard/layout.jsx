import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Top Traders on Vanta Trading',
  description:
    'See the top performing scaled traders on Vanta Trading. Live rankings, returns, key metrics, and payout history.',
  ogTitle: 'Vanta Trading Leaderboard — Top Funded Traders, Live',
  ogDescription:
    'Transparent, onchain performance rankings for every Vanta Trading scaled trader. All-time returns, key metrics, and verified USDC payouts.',
  path: '/vanta/leaderboard',
  brand: 'vanta',
})

export default function VantaLeaderboardLayout({ children }) {
  return children
}
