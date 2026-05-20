'use client'

import { createContext, useContext, useCallback } from 'react'
import { BRANDS, getBrandConfig, brandifyText } from './brand-config'

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

export { getBrandConfig, brandifyText }
