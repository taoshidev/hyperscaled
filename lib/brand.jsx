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
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$2.5M. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
  lunarcrush: {
    id: 'lunarcrush',
    name: 'LunarCrush',
    prefix: '/lunarcrush',
    logo: '/lunarcrush-logo.svg',
    tagline: 'Scaled Trading on Hyperliquid, backed by LunarCrush social intelligence.',
    siteUrl: 'https://lunarcrush.com',
    twitter: '@LunarCrush',
    socials: {
      twitter: 'https://x.com/LunarCrush',
      discord: null,
      github: 'https://github.com/lunarcrush',
      telegram: 'https://t.me/lunarcrush',
      youtube: 'https://youtube.com/@LunarCrush',
      support: 'mailto:support@lunarcrush.com',
    },
    showExtension: false,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to LunarCrush', url: 'https://lunarcrush.com' },
    heroEyebrow: 'Built on Hyperliquid. Powered by LunarCrush social intelligence.',
    heroSub: 'Trade Hyperliquid with a scaled account and live LunarCrush social data on every asset. Keep 100% of your profits. Scale to\u00a0$2.5M. Monthly USDC payouts, onchain.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
    footerTagline: 'Scaled trading on Hyperliquid, backed by LunarCrush social intelligence.',
    popularTier: 'tier-5',
    copy: {
      howItWorksHeading: 'Trade Hyperliquid. Read the crowd. Earn a scaled\u00a0account.',
      howItWorksStep2Title: 'Trade on Hyperliquid with LunarCrush data',
      howItWorksStep2Body: 'Connect your Hyperliquid wallet. Trade the same order book you already use. LunarCrush social metrics (AltRank, sentiment, mentions, creator activity) are available live in the dashboard and through MCP in Claude, ChatGPT, and Gemini. Your performance is read automatically from Hyperliquid\'s public\u00a0stream.',
      howItWorksStep3Body: 'Hit the 10% profit target to pass and activate your scaled account immediately. Payouts land in your wallet every 7 days in USDC. Keep 100% of what you\u00a0earn.',
      problemIntro: 'Legacy scaled trading is broken by design. KYC walls, profit extraction, and centralized discretion mean profitable traders are systematically underserved. LunarCrush fixes the economics and adds a social data layer the legacy model cannot\u00a0match.',
      solutionHeading: 'Open. Onchain. Socially\u00a0informed.',
      solutionIntro: 'LunarCrush mirrors your Hyperliquid trades into a protocol-scaled simulated account and pays out performance rewards in USDC, onchain and automatic. Every asset comes with live social intelligence: AltRank, sentiment, mentions, and creator activity, updated in real\u00a0time.',
      solutionPillar3Title: 'Social Intelligence Built In',
      solutionPillar3Desc: 'Live LunarCrush data on every asset you trade. Available in the dashboard and through MCP in Claude, ChatGPT, and Gemini.',
      featuresHeading: 'Built for traders who read the crowd before the price\u00a0moves.',
      feature3Title: 'Social Signal on Every Asset',
      feature3Body: 'Every Hyperliquid perpetual you trade comes with live LunarCrush metrics: AltRank, sentiment, mentions, creator activity. Track attention shifts before the price\u00a0reacts.',
      feature6Title: 'Query via MCP',
      feature6Body: 'Pull LunarCrush social data into Claude, ChatGPT, Gemini, or your own agent. Build strategies that combine price action with attention and sentiment in a single\u00a0query.',
      pricingBanner: 'Launch Pricing Active. Save up to 50% for a limited\u00a0time.',
      pricingSubheadlineSuffix: 'USDC payouts distributed\u00a0monthly.',
      pricingFooter: 'All tiers: 10% profit target. 5% max drawdown. 100% profit split. Monthly payouts. No time limit. Live LunarCrush social data on every\u00a0asset.',
      pricingIncluded5Title: 'Social Data Included',
      pricingIncluded5Desc: 'Live LunarCrush AltRank, sentiment, and mentions on every Hyperliquid\u00a0pair.',
    },
    faqOverrides: {
      'what-is-hyperscaled': 'LunarCrush is a scaled trading platform built on Hyperliquid, with LunarCrush social intelligence integrated on every asset. Connect your wallet, trade, pass a one-step challenge, and collect 100% of your performance rewards in USDC. Monthly, automatic, onchain.',
      'algo-trading': 'Yes. Algorithmic and automated strategies are fully supported, including agents that query LunarCrush data via MCP or API. No restrictions on automation, bots, or frequency.',
      'profit-split': '100%. LunarCrush takes 0% of your profits, including on accounts scaled above\u00a0$100K.',
      'what-built-on': 'LunarCrush Scaled is powered by Hyperscaled, a decentralized prop trading network built on Hyperliquid and Bittensor Subnet 8, with LunarCrush social intelligence integrated on top. Trades are mirrored onchain, rules are published openly, and payouts are distributed automatically in USDC.',
    },
    faqAddons: [
      {
        category: 'Technical & Platform',
        items: [
          {
            id: 'lunarcrush-data-access',
            question: 'How do I access LunarCrush social data while trading?',
            answer: 'LunarCrush metrics (AltRank, sentiment, mentions, creator activity) are embedded in the trading dashboard on every eligible pair. You can also query the same data from Claude, ChatGPT, Gemini, or any MCP-compatible agent, and pull it into custom strategies via the LunarCrush API.',
          },
          {
            id: 'lunarcrush-subscription',
            question: 'Do I need a paid LunarCrush subscription to trade here?',
            answer: 'No. Social data shown on the trading dashboard is included with your scaled account at no additional cost. A standalone LunarCrush subscription is only required for direct API and MCP access outside this platform.',
          },
        ],
      },
    ],
    pricingTiers: [
      { id: 'tier-1', name: '$5K Account', accountSize: '$5,000', launchPrice: 39, profitTarget: '10%', profitTargetAmount: '$500', maxDrawdown: '5%', maxDrawdownAmount: '$250', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $100K', timeLimit: 'None', cta: 'Start $5K Challenge', popular: false },
      { id: 'tier-2', name: '$10K Account', accountSize: '$10,000', launchPrice: 69, profitTarget: '10%', profitTargetAmount: '$1,000', maxDrawdown: '5%', maxDrawdownAmount: '$500', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $100K', timeLimit: 'None', cta: 'Start $10K Challenge', popular: false },
      { id: 'tier-3', name: '$25K Account', accountSize: '$25,000', launchPrice: 149, profitTarget: '10%', profitTargetAmount: '$2,500', maxDrawdown: '5%', maxDrawdownAmount: '$1,250', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $100K', timeLimit: 'None', cta: 'Start $25K Challenge', popular: false },
      { id: 'tier-4', name: '$50K Account', accountSize: '$50,000', launchPrice: 249, profitTarget: '10%', profitTargetAmount: '$5,000', maxDrawdown: '5%', maxDrawdownAmount: '$2,500', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $100K', timeLimit: 'None', cta: 'Start $50K Challenge', popular: false },
      { id: 'tier-5', name: '$100K Account', accountSize: '$100,000', launchPrice: 449, profitTarget: '10%', profitTargetAmount: '$10,000', maxDrawdown: '5%', maxDrawdownAmount: '$5,000', profitSplit: '100%', payoutCycle: 'Monthly', scalingPath: 'Up to $2.5M', timeLimit: 'None', cta: 'Start $100K Challenge', popular: true },
    ],
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
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to\u00a0$2.5M. Powered by Hyperscaled.',
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
