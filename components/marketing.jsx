'use client'

import Hero from './marketing/Hero'
import HowItWorks from './marketing/HowItWorks'
import HomePricing from './marketing/HomePricing'
import Features from './marketing/Features'
import Solution from './marketing/Solution'
import Problem from './marketing/Problem'
import PartnersCTA from './marketing/PartnersCTA'
import FAQ from './marketing/FAQ'
import { useBrand } from '@/lib/brand'

export default function App({ tiers }) {
  const brand = useBrand()

  return (
    <>
      <Hero />
      <HowItWorks tiers={tiers} />
      <HomePricing tiers={tiers} />
      <Features />
      <Solution />
      <Problem />
      {brand.showPartnersCTA && <PartnersCTA />}
      <FAQ />
    </>
  )
}
