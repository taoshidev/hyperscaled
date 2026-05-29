'use client'

import { useBrand } from '@/lib/brand'

/*
 * ComplianceDisclosure — renders the required marketing disclosures for
 * brands that carry a `compliance` block in their config (currently
 * HyperFunded / bitcast, per the Vanta AMPA + Marketing Guide).
 *
 * Renders nothing for brands without `brand.compliance`, so every other
 * brand is completely unaffected.
 *
 * Variants:
 *   - "cta"  (default): compact block placed near a primary CTA. Shows the
 *             Authorized-Marketing-Partner status line, the four required
 *             disclosures, and the no-guarantee line.
 *   - "inline": single muted line — just the status + simulated/no-funded
 *             reminder, for tight spots.
 */
export default function ComplianceDisclosure({ variant = 'cta', className = '', showNoGuarantee = true }) {
  const brand = useBrand()
  const c = brand.compliance
  if (!c) return null

  if (variant === 'inline') {
    return (
      <p className={`text-[11px] leading-relaxed text-zinc-500 ${className}`}>
        {c.statusLine}{' '}
        Simulated trading only — no funded or live trading account is created or provided.
      </p>
    )
  }

  return (
    <div
      className={`text-[11px] leading-relaxed text-zinc-500 max-w-[68ch] ${className}`}
      role="note"
      aria-label="Compliance disclosures"
    >
      <p className="text-zinc-400 font-medium mb-1.5">{c.statusLine}</p>
      <ul className="space-y-1">
        {c.disclosures.map((d, i) => (
          <li key={i} className="flex gap-1.5">
            <span aria-hidden className="text-zinc-600 select-none">·</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
      {showNoGuarantee && c.noGuarantee && (
        <p className="mt-1.5 text-zinc-600">{c.noGuarantee}</p>
      )}
    </div>
  )
}
