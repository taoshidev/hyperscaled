'use client'

import Hero from './marketing/Hero'
import HowItWorks from './marketing/HowItWorks'
import HomePricing from './marketing/HomePricing'
import Features from './marketing/Features'
import Solution from './marketing/Solution'
import Problem from './marketing/Problem'
import PartnersCTA from './marketing/PartnersCTA'
import FAQ from './marketing/FAQ'

export default function App({ tiers }) {
  return (
    <>
      <Hero />
      <HowItWorks tiers={tiers} />
      <HomePricing tiers={tiers} />
      <Features />
      <Solution />
      <Problem />
      <PartnersCTA />
      <FAQ />
    </>
  )
}
