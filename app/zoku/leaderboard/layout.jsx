import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Top Traders on Zoku',
  description:
    'See the top performing scaled traders on Zoku. Live rankings, returns, key metrics, and payout history.',
  ogTitle: 'Zoku Leaderboard — Top Funded Traders, Live',
  ogDescription:
    'Transparent, onchain performance rankings for every Zoku scaled trader. All-time returns, key metrics, and verified USDC payouts.',
  path: '/zoku/leaderboard',
  brand: 'zoku',
})

export default function ZokuLeaderboardLayout({ children }) {
  return children
}
