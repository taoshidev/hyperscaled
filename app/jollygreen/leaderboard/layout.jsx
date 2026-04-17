import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Top Traders on Jolly Green Investor',
  description:
    'See the top performing scaled traders on Jolly Green Investor. Live rankings, returns, key metrics, and payout history.',
  ogTitle: 'Jolly Green Investor Leaderboard — Top Funded Traders, Live',
  ogDescription:
    'Transparent, onchain performance rankings for every Jolly Green Investor scaled trader. All-time returns, key metrics, and verified USDC payouts.',
  path: '/jollygreen/leaderboard',
  brand: 'jollygreen',
})

export default function JollyGreenLeaderboardLayout({ children }) {
  return children
}
