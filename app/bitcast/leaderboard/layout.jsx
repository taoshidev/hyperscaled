import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Top Traders on HyperFunded',
  description: 'See the top performing scaled traders on HyperFunded. Live rankings, returns, key metrics, and payout history.',
  ogTitle: 'HyperFunded Leaderboard — Top Scaled Traders, Live',
  ogDescription: 'Transparent, onchain performance rankings for every HyperFunded scaled trader. All-time returns, key metrics, and verified USDC payouts.',
  path: '/bitcast/leaderboard',
  brand: 'bitcast',
})

export default function BitcastLeaderboardLayout({ children }) {
  return children
}
