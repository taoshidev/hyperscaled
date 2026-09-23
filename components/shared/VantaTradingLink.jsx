'use client'

import { VANTA_TRADING_URL } from '@/lib/sunset'
import { trackCtaClick } from '@/lib/analytics'

// External CTA to Vanta Trading (Notion #1560). Always a new tab so traders
// keep their Hyperscaled page open. `label` is the analytics label; children
// render the visible content so call sites keep their own styling.
export default function VantaTradingLink({ label, location, className, children, ...rest }) {
  return (
    <a
      href={VANTA_TRADING_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackCtaClick({ label, location, destination: VANTA_TRADING_URL })}
      className={className}
      {...rest}
    >
      {children}
    </a>
  )
}
