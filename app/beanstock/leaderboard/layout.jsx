import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Top Traders on Beanstock',
  description:
    'See the top performing scaled traders on Beanstock. Live rankings, returns, key metrics, and payout history.',
  ogTitle: 'Beanstock Leaderboard — Top Funded Traders, Live',
  ogDescription:
    'Transparent, onchain performance rankings for every Beanstock scaled trader. All-time returns, key metrics, and verified USDC payouts.',
  path: '/beanstock/leaderboard',
  brand: 'beanstock',
})

export default function BeanstockLeaderboardLayout({ children }) {
  return children
}
