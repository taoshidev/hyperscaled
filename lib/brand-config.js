const BRANDS = {
  hyperscaled: {
    id: 'hyperscaled',
    name: 'Hyperscaled',
    prefix: '',
    logo: '/hyperscaled-logo.svg',
    mark: '/hyperscaled-mark.svg',
    accentColor: '#00C6A7',
    accentRgb: '0, 198, 167',
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
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to $400K. Built on the most advanced decentralized prop trading infrastructure in the world.',
    poweredBy: { name: 'Bittensor', url: 'https://bittensor.com' },
  },
  bitcast: {
    id: 'bitcast',
    name: 'HyperFunded',
    prefix: '/bitcast',
    logo: '/hyperfunded-logo.png',
    mark: '/hyperfunded-mark.png',
    accentColor: '#97FCE4',
    accentRgb: '151, 252, 228',
    tagline: 'Scaled Perp Trading on Hyperliquid',
    siteUrl: 'https://hyperfunded.co',
    twitter: '@hyperfunded_co',
    socials: {
      twitter: 'https://x.com/hyperfunded_co',
      discord: null,
      github: null,
      telegram: null,
      support: 'mailto:support@hyperfunded.co',
    },
    accountType: 'scaled',
    showExtension: false,
    showBetaBadge: false,
    showLiquidCrystal: true,
    heroBeams: true,
    showPartnersCTA: false,
    parentSite: null,
    heroEyebrow: 'Built on Hyperliquid · Powered by HyperFunded',
    heroSub: 'Trade perps on Hyperliquid with access to scaled capital. Keep 100% of eligible performance rewards, and grow your account to $400K.',
    poweredBy: { name: 'HyperFunded', url: 'https://hyperfunded.co' },
    footerTagline: 'Scaled perp trading on Hyperliquid.',
    competitorLabel: 'Legacy Prop Firms',
    heroStats: [
      { value: '1-Step', label: 'Challenge' },
      { value: '100%', label: 'Profit Split' },
      { value: '$400K', label: 'Max Scale' },
    ],
  },
  lunarcrush: {
    id: 'lunarcrush',
    name: 'LunarCrush',
    prefix: '/lunarcrush',
    logo: '/lunarcrush-logo.svg',
    accentColor: '#8b5cf6',
    accentRgb: '139, 92, 246',
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
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to $400K. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
  beanstock: {
    id: 'beanstock',
    name: 'Beanstock Trading',
    prefix: '/beanstock',
    logo: '/beanstock-logo.svg',
    accentColor: '#62be57',
    accentRgb: '98, 190, 87',
    tagline: 'Funded Trading on Hyperliquid',
    siteUrl: 'https://beanstocktrading.com',
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
    parentSite: { label: 'Back to Beanstock Trading', url: 'https://beanstocktrading.com' },
    heroEyebrow: 'Funded Trading on Hyperliquid',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to $400K.',
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
    accentColor: '#ffffff',
    accentRgb: '255, 255, 255',
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
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to $400K. Built on Vanta, the most advanced decentralized prop trading infrastructure in the world. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
}

export function getBrandConfig(brandId) {
  return BRANDS[brandId] || BRANDS.hyperscaled
}

export function brandifyText(text, brand) {
  if (!text || brand.id === 'hyperscaled') return text
  let result = text
  if (brand.accountType !== 'scaled') {
    result = result
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
  }
  return result
    .replace(/app\.hyperscaled\.trade/g, brand.siteUrl.replace('https://', ''))
    .replace(/\bHyperscaled/g, brand.name)
}

export { BRANDS }
