import { getActiveTiersForMinerSlug } from '@/lib/miners'
import { PRICING_TIERS } from '@/lib/constants'

const DEFAULT_MINER_SLUG = process.env.DEFAULT_MINER_SLUG || 'vanta'

// Static per-accountSize metadata not stored in DB (marketing copy, rules)
const TIER_DISPLAY_META = {
  1000:   { id: 'free',   standardPrice: 0,   scalingPath: 'None',         popular: false, cta: 'Try for Free'         },
  5000:   { id: 'tier-1', standardPrice: 59,  scalingPath: 'Up to $400K', popular: false, cta: 'Start $5K Challenge'   },
  10000:  { id: 'tier-2', standardPrice: 109, scalingPath: 'Up to $400K', popular: false, cta: 'Start $10K Challenge'  },
  25000:  { id: 'tier-3', standardPrice: 239, scalingPath: 'Up to $400K', popular: false, cta: 'Start $25K Challenge'  },
  50000:  { id: 'tier-4', standardPrice: 499, scalingPath: 'Up to $400K', popular: false, cta: 'Start $50K Challenge'  },
  100000: { id: 'tier-5', standardPrice: 799, scalingPath: 'Up to $400K', popular: true,  cta: 'Start $100K Challenge' },
}

function accountLabel(n) {
  if (n >= 1000000) return `$${n / 1000000}M`
  return `$${n / 1000}K`
}

function formatAmount(n) {
  return `$${n.toLocaleString('en-US')}`
}

export async function fetchDbPricingTiers(slug) {
  try {
    const minerSlug = slug || DEFAULT_MINER_SLUG
    const dbTiers = await getActiveTiersForMinerSlug(minerSlug)
    if (!dbTiers || dbTiers.length === 0) return PRICING_TIERS

    return dbTiers.map((t, i) => {
      const meta = TIER_DISPLAY_META[t.accountSize] ?? {}
      const launchPrice = Number(t.priceUsdc)
      const listStandard = meta.standardPrice ?? launchPrice
      const standardPrice =
        listStandard > launchPrice ? listStandard : launchPrice
      return {
        id:                 meta.id ?? `tier-${i + 1}`,
        name:               `${accountLabel(t.accountSize)} Account`,
        accountSize:        formatAmount(t.accountSize),
        launchPrice,
        standardPrice,
        profitTarget:       '10%',
        profitTargetAmount: formatAmount(Math.round(t.accountSize * 0.1)),
        maxDrawdown:        '5%',
        maxDrawdownAmount:  formatAmount(Math.round(t.accountSize * 0.05)),
        profitSplit:        `${t.profitSplit}%`,
        payoutCycle:        'Monthly',
        scalingPath:        meta.scalingPath ?? 'Up to $400K',
        timeLimit:          'None',
        cta:                meta.cta ?? `Start ${accountLabel(t.accountSize)} Challenge`,
        popular:            meta.popular ?? false,
      }
    })
  } catch (err) {
    console.error('[pricing-db] DB fetch failed, falling back to constants:', err.message)
    return PRICING_TIERS
  }
}
