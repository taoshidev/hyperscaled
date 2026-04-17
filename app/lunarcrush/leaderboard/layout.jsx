import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Top Traders on LunarCrush',
  description: 'See the top performing scaled traders on LunarCrush. Live rankings, returns, key metrics, and payout history.',
  ogTitle: 'LunarCrush Leaderboard — Top Funded Traders, Live',
  ogDescription: 'Transparent, onchain performance rankings for every LunarCrush scaled trader. All-time returns, key metrics, and verified USDC payouts.',
  path: '/lunarcrush/leaderboard',
  brand: 'lunarcrush',
})

export default function LunarCrushLeaderboardLayout({ children }) {
  return children
}
