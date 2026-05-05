'use client'

import { createContext, useContext, useCallback } from 'react'

const BRANDS = {
  hyperscaled: {
    id: 'hyperscaled',
    name: 'Hyperscaled',
    prefix: '',
    logo: '/hyperscaled-logo.svg',
    mark: '/hyperscaled-mark.svg',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: process.env.NEXT_PUBLIC_HYPERSCALED_BASE_URL || 'https://hyperscaled.trade',
    twitter: '@hyperscaledhq',
    socials: {
      twitter: 'https://x.com/hyperscaledhq',
      discord: 'https://discord.gg/hyperscaledhq',
      github: 'https://github.com/taoshidev',
      telegram: 'https://t.me/hyperscaled_bot',
      support: 'mailto:support@hyperscaled.trade',
    },
    accountType: 'scaled',
    showExtension: true,
    showBetaBadge: false,
    showLiquidCrystal: true,
    showPartnersCTA: true,
    heroEyebrow: 'Built on Hyperliquid · Powered by Bittensor',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$400K. Built on the most advanced decentralized prop trading infrastructure in the\u00a0world.',
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
    accountType: 'scaled',
    showExtension: false,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to Bitcast', url: 'https://bitcast.network' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$400K. Powered by Hyperscaled.',
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
    accountType: 'scaled',
    showExtension: false,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to LunarCrush', url: 'https://lunarcrush.com' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$400K. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
  beanstock: {
    id: 'beanstock',
    name: 'Beanstock Trading',
    prefix: '/beanstock',
    logo: '/beanstock-logo.svg',
    tagline: 'Funded Trading on Hyperliquid',
    siteUrl: 'https://jollygreeninvestor.com',
    twitter: '@jollygreenmoney',
    socials: {
      twitter: 'https://x.com/jollygreenmoney',
      discord: 'https://discord.gg/wSC49Gtjsy',
      github: null,
      telegram: 'https://t.me/beanstockcalls',
      youtube: 'https://www.youtube.com/@getbeanstock',
      support: 'mailto:hello@getbeanstock.com',
    },
    accountType: 'funded',
    showExtension: true,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to Beanstock Trading', url: 'https://jollygreeninvestor.com' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$400K. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
    pricingTiers: [
      { id: 'tier-1', name: '$5K Account', accountSize: '$5,000', launchPrice: 59, profitTarget: '10%', profitTargetAmount: '$500', maxDrawdown: '5%', maxDrawdownAmount: '$250', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $400K', timeLimit: 'None', cta: 'Start $5K Challenge', popular: false },
      { id: 'tier-2', name: '$10K Account', accountSize: '$10,000', launchPrice: 109, profitTarget: '10%', profitTargetAmount: '$1,000', maxDrawdown: '5%', maxDrawdownAmount: '$500', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $400K', timeLimit: 'None', cta: 'Start $10K Challenge', popular: false },
      { id: 'tier-3', name: '$25K Account', accountSize: '$25,000', launchPrice: 239, profitTarget: '10%', profitTargetAmount: '$2,500', maxDrawdown: '5%', maxDrawdownAmount: '$1,250', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $400K', timeLimit: 'None', cta: 'Start $25K Challenge', popular: false },
      { id: 'tier-4', name: '$50K Account', accountSize: '$50,000', launchPrice: 499, profitTarget: '10%', profitTargetAmount: '$5,000', maxDrawdown: '5%', maxDrawdownAmount: '$2,500', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $400K', timeLimit: 'None', cta: 'Start $50K Challenge', popular: false },
      { id: 'tier-5', name: '$100K Account', accountSize: '$100,000', launchPrice: 799, profitTarget: '10%', profitTargetAmount: '$10,000', maxDrawdown: '5%', maxDrawdownAmount: '$5,000', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $400K', timeLimit: 'None', cta: 'Start $100K Challenge', popular: true },
    ],
  },
  vanta: {
    id: 'vanta',
    name: 'Vanta Trading',
    prefix: '/vanta',
    logo: '/vanta-logo.svg',
    mark: '/vanta-mark.svg',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: 'https://vantatrading.io',
    twitter: '@vantatrading',
    socials: {
      twitter: 'https://x.com/vantatrading',
      discord: 'https://discord.gg/vantatrading',
      github: 'https://github.com/taoshidev',
      telegram: 'https://t.me/hyperscaled_bot',
      support: 'mailto:support@vantatrading.io',
    },
    accountType: 'scaled',
    showExtension: true,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to Vanta Trading', url: 'https://vantatrading.io' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$400K. Built on Vanta, the most advanced decentralized prop trading infrastructure in the world. Powered by Hyperscaled.',
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

export function brandifyText(text, brand) {
  if (!text || brand.accountType === 'scaled') return text
  return text
    .replace(/\bscaled account/g, `${brand.accountType} account`)
    .replace(/\bscaled accounts/g, `${brand.accountType} accounts`)
    .replace(/\bscaled trader/g, `${brand.accountType} trader`)
    .replace(/\bscaled traders/g, `${brand.accountType} traders`)
    .replace(/\bscaled trading/g, `${brand.accountType} trading`)
    .replace(/\bscaled capital/g, `${brand.accountType} capital`)
    .replace(/\baccounts scaled/g, `accounts ${brand.accountType}`)
    .replace(/\bI'm scaled/g, `I'm ${brand.accountType}`)
    .replace(/\bOnce scaled/g, `Once ${brand.accountType}`)
    .replace(/\bwhen scaled/g, `when ${brand.accountType}`)
    .replace(/\bHyperscaled/g, brand.name)
}
