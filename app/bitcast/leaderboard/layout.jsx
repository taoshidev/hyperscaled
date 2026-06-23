import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Top Traders on Hyperstack',
  description:
    'See the top performing scaled traders on Hyperstack. Live rankings, returns, key metrics, and payout history.',
  ogTitle: 'Hyperstack Leaderboard — Top Funded Traders, Live',
  ogDescription:
    'Transparent, onchain performance rankings for every Hyperstack scaled trader. All-time returns, key metrics, and verified USDC payouts.',
  path: '/bitcast/leaderboard',
  brand: 'bitcast',
})

export default function BitcastLeaderboardLayout({ children }) {
  return children
}
