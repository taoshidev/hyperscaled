'use client'

import Nav from '@/components/marketing/Nav'

export default function BeanstockLeaderboardPage() {
  return (
    <div className="bg-black text-white font-sans min-h-[100dvh]">
      <Nav />
      <main className="pt-16 min-h-[100dvh] flex items-center justify-center px-6">
        <div className="max-w-[48ch] text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">
            Leaderboard coming soon
          </h1>
          <p className="text-zinc-400 leading-relaxed [text-wrap:pretty]">
            Performance rankings are being prepared and will be published once reviewed. Check back soon.
          </p>
        </div>
      </main>
    </div>
  )
}
