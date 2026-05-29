import { buildMetadata } from '@/lib/metadata'

export const metadata = buildMetadata({
  title: 'Leaderboard — HyperFunded',
  description: 'HyperFunded leaderboard. Coming soon.',
  ogTitle: 'Leaderboard — HyperFunded',
  ogDescription: 'HyperFunded leaderboard. Coming soon.',
  path: '/bitcast/leaderboard',
  robots: { index: false, follow: false },
  brand: 'bitcast',
})

export default function BitcastLeaderboardLayout({ children }) {
  return children
}
