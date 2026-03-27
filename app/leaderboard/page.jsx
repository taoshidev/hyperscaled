'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/marketing/Nav'
import Leaderboard from '@/components/marketing/Leaderboard'

function LeaderboardContent() {
  const searchParams = useSearchParams()
  const initialAddr = searchParams.get('addr') || ''

  return (
    <div className="bg-[#09090b] text-white font-sans min-h-[100dvh]">
      <Nav />
      <main className="pt-16">
        <Leaderboard
          initialSearch={initialAddr}
        />
      </main>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="bg-[#09090b] min-h-[100dvh]" />}>
      <LeaderboardContent />
    </Suspense>
  )
}
