import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Top Traders on Hyperscaled',
  description:
    'See the top performing funded traders on Hyperscaled. Live rankings, returns, key metrics, and payout history.',
  ogTitle: 'Hyperscaled Leaderboard — Top Funded Traders, Live',
  ogDescription:
    'Transparent, onchain performance rankings for every Hyperscaled funded trader. All-time returns, key metrics, and verified USDC payouts.',
  path: '/vanta/leaderboard',
  brand: 'vanta',
})

export default function VantaLeaderboardLayout({ children }) {
  return children
}
