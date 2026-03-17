'use client'

import Nav from './marketing/Nav'
import Hero from './marketing/Hero'
import Stats from './marketing/Stats'
import Problem from './marketing/Problem'
import Solution from './marketing/Solution'
import HowItWorks from './marketing/HowItWorks'
import Features from './marketing/Features'
import PartnersCTA from './marketing/PartnersCTA'
import FAQ from './marketing/FAQ'
import Footer from './marketing/Footer'

export default function App() {
  return (
    <div className="bg-[#09090b] text-white font-sans">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Problem />
        <Solution />
        <HowItWorks />
        <Features />
        <PartnersCTA />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
