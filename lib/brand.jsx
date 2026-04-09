'use client'

import { createContext, useContext, useCallback } from 'react'

const BRANDS = {
  hyperscaled: {
    id: 'hyperscaled',
    name: 'Hyperscaled',
    prefix: '',
    logo: '/hyperscaled-logo.svg',
    tagline: 'Funded Trading on Hyperliquid',
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
  },
  vanta: {
    id: 'vanta',
    name: 'Vanta Trading',
    prefix: '/vanta',
    logo: '/vanta-logo.svg',
    tagline: 'Funded Trading on Hyperliquid',
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
  },
}

const BrandContext = createContext(BRANDS.hyperscaled)

export function BrandProvider({ brand = 'hyperscaled', children }) {
  const config = BRANDS[brand] || BRANDS.hyperscaled
  return (
    <BrandContext.Provider value={config}>
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
