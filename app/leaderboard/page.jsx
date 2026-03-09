'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/marketing/Nav'
import Leaderboard from '@/components/marketing/Leaderboard'
import TraderDashboard from '@/components/marketing/TraderDashboard'

export default function LeaderboardPage() {
  const searchParams = useSearchParams()
  const [selectedTrader, setSelectedTrader] = useState(null)

  useEffect(() => {
    const addr = searchParams.get('addr')
    if (addr) setSelectedTrader(addr)
  }, [searchParams])

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
