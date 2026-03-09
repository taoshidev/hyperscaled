'use client'

import { useState } from 'react'
import Nav from './marketing/Nav'
import Hero from './marketing/Hero'
import Stats from './marketing/Stats'
import Problem from './marketing/Problem'
import Solution from './marketing/Solution'
import HowItWorks from './marketing/HowItWorks'
import Features from './marketing/Features'
import Leaderboard from './marketing/Leaderboard'
import FAQ from './marketing/FAQ'
import Footer from './marketing/Footer'
import TraderDashboard from './marketing/TraderDashboard'

export default function App() {
  const [selectedTrader, setSelectedTrader] = useState(null)

  return (
    <div className="bg-[#09090b] text-white font-sans">
      <Nav onSearch={setSelectedTrader} />
      <main>
        <Hero />
        <Stats />
        <Problem />
        <Solution />
        <HowItWorks />
        <Features />
        <Leaderboard onSelectTrader={setSelectedTrader} />
        <FAQ />
      </main>
      <Footer />
      <TraderDashboard addr={selectedTrader} onClose={() => setSelectedTrader(null)} />
    </div>
  )
}
