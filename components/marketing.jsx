'use client'

import Hero from './marketing/Hero'
import HowItWorks from './marketing/HowItWorks'
import HomePricing from './marketing/HomePricing'
import VideoSection from './marketing/VideoSection'
import Features from './marketing/Features'
import Solution from './marketing/Solution'
import Problem from './marketing/Problem'
import PartnersCTA from './marketing/PartnersCTA'
import FAQ from './marketing/FAQ'
import { useBrand } from '@/lib/brand'

export default function App({ tiers, activeCampaign = null }) {
  const brand = useBrand()
  const resolvedTiers = tiers ?? brand.pricingTiers

  return (
    <>
      <Hero activeCampaign={activeCampaign} />
      <HowItWorks tiers={resolvedTiers} />
      {brand.homeVideo && <VideoSection video={brand.homeVideo} />}
      <HomePricing tiers={resolvedTiers} />
      <Features />
      <Solution />
      <Problem />
      {brand.showPartnersCTA && <PartnersCTA />}
      <FAQ />
    </>
  )
}
