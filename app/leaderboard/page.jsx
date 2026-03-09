'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/marketing/Nav'
import Leaderboard from '@/components/marketing/Leaderboard'
import TraderDashboard from '@/components/marketing/TraderDashboard'

function LeaderboardContent() {
  const searchParams = useSearchParams()
  const [selectedTrader, setSelectedTrader] = useState(() => searchParams.get('addr'))

  return (
    <div className="bg-[#09090b] text-white font-sans min-h-screen">
      <Nav onSearch={setSelectedTrader} />
      <main className="pt-16">
        <Leaderboard onSelectTrader={setSelectedTrader} />
      </main>
      <TraderDashboard addr={selectedTrader} onClose={() => setSelectedTrader(null)} />
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="bg-[#09090b] min-h-screen" />}>
      <LeaderboardContent />
    </Suspense>
  )
}
