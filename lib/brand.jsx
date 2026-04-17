'use client'

import { createContext, useContext, useCallback } from 'react'

const BRANDS = {
  hyperscaled: {
    id: 'hyperscaled',
    name: 'Hyperscaled',
    prefix: '',
    logo: '/hyperscaled-logo.svg',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: 'https://hyperscaled.trade',
    twitter: '@hyperscaledhq',
    socials: {
      twitter: 'https://x.com/hyperscaledhq',
      discord: 'https://discord.gg/hyperscaledhq',
      github: 'https://github.com/taoshidev',
      telegram: 'https://t.me/hyperscaled_bot',
      support: 'mailto:support@hyperscaled.trade',
    },
    showExtension: true,
    showBetaBadge: true,
    showLiquidCrystal: true,
    showPartnersCTA: true,
    heroEyebrow: 'Built on Hyperliquid · Powered by Bittensor',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$2.5M. Built on the most advanced decentralized prop trading infrastructure in the\u00a0world.',
    poweredBy: { name: 'Bittensor', url: 'https://bittensor.com' },
  },
  bitcast: {
    id: 'bitcast',
    name: 'Bitcast',
    prefix: '/bitcast',
    logo: '/bitcast-logo.svg',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: 'https://bitcast.network',
    twitter: '@Bitcast_Network',
    socials: {
      twitter: 'https://x.com/Bitcast_Network',
      discord: 'https://discord.com/invite/6pJzBcrs7x',
      github: null,
      telegram: null,
      support: 'mailto:support@bitcast.network',
    },
    showExtension: false,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to Bitcast', url: 'https://bitcast.network' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$2.5M. Built on Bitcast, the most advanced decentralized prop trading infrastructure in the world. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
  lunarcrush: {
    id: 'lunarcrush',
    name: 'LunarCrush',
    prefix: '/lunarcrush',
    logo: '/lunarcrush-logo.svg',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: 'https://lunarcrush.com',
    twitter: '@lunarcrush',
    socials: {
      twitter: 'https://x.com/lunarcrush',
      discord: null,
      github: null,
      telegram: 'https://t.me/lunarcrush',
      youtube: 'https://youtube.com/@lunarcrush',
      support: 'mailto:support@lunarcrush.com',
    },
    showExtension: false,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to LunarCrush', url: 'https://lunarcrush.com' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$2.5M. Built on LunarCrush, the most advanced decentralized prop trading infrastructure in the world. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
  beanstock: {
    id: 'beanstock',
    name: 'Beanstock',
    prefix: '/beanstock',
    logo: '/beanstock-logo.svg',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: 'https://jollygreeninvestor.com',
    twitter: '@jollygreenmoney',
    socials: {
      twitter: 'https://x.com/jollygreenmoney',
      discord: 'https://discord.com/invite/wSC49Gtjsy',
      github: 'https://github.com/taoshidev',
      telegram: 'https://t.me/beanstockcalls',
      support: 'mailto:support@jollygreeninvestor.com',
    },
    showExtension: false,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to Beanstock', url: 'https://jollygreeninvestor.com' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$2.5M. Built on Beanstock, the most advanced decentralized prop trading infrastructure in the world. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
  vanta: {
    id: 'vanta',
    name: 'Vanta Trading',
    prefix: '/vanta',
    logo: '/vanta-logo.svg',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: 'https://vantatrading.io',
    twitter: '@vantatrading',
    socials: {
      twitter: 'https://x.com/vantatrading',
      discord: 'https://discord.gg/vantatrading',
      github: 'https://github.com/taoshidev',
      telegram: 'https://t.me/vantatrading_bot',
      support: 'mailto:support@vantatrading.io',
    },
    showExtension: false,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to Vanta Trading', url: 'https://vantatrading.io' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$2.5M. Built on Vanta, the most advanced decentralized prop trading infrastructure in the world. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
}

const BrandContext = createContext(BRANDS.hyperscaled)

export function BrandProvider({ brand = 'hyperscaled', prefixOverride, children }) {
  const config = BRANDS[brand] || BRANDS.hyperscaled
  const providerConfig = {
    ...config,
    prefix: prefixOverride ?? config.prefix,
  }
  return (
    <BrandContext.Provider value={providerConfig}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  return useContext(BrandContext)
}

export function useBrandHref() {
  const { prefix } = useContext(BrandContext)
  return useCallback((path) => `${prefix}${path}`, [prefix])
}
