import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Beanstock',
  description: 'Beanstock leaderboard. Coming soon.',
  ogTitle: 'Leaderboard — Beanstock',
  ogDescription: 'Beanstock leaderboard. Coming soon.',
  path: '/beanstock/leaderboard',
  robots: { index: false, follow: false },
  brand: 'beanstock',
})

export default function BeanstockLeaderboardLayout({ children }) {
  return children
}
