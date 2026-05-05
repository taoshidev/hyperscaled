import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Top Traders on Bitcast',
  description: 'See the top performing scaled traders on Bitcast. Live rankings, returns, key metrics, and payout history.',
  ogTitle: 'Bitcast Leaderboard — Top Funded Traders, Live',
  ogDescription: 'Transparent, onchain performance rankings for every Bitcast scaled trader. All-time returns, key metrics, and verified USDC payouts.',
  path: '/bitcast/leaderboard',
  brand: 'bitcast',
})

export default function BitcastLeaderboardLayout({ children }) {
  return children
}
