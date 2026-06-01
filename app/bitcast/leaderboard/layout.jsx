import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — Hyperstack',
  description: 'Hyperstack leaderboard. Coming soon.',
  ogTitle: 'Leaderboard — Hyperstack',
  ogDescription: 'Hyperstack leaderboard. Coming soon.',
  path: '/bitcast/leaderboard',
  robots: { index: false, follow: false },
  brand: 'bitcast',
})

export default function BitcastLeaderboardLayout({ children }) {
  return children
}
