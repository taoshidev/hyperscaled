# Build State

Last updated: 2026-03-12

## Marketing Site (`/`)

**Status**: Complete (first pass)

| Item | State |
|------|-------|
| Hero + CTA | Done |
| Features section | Done |
| How It Works | Done |
| Problem / Solution | Done |
| Stats section | Done |
| FAQ | Done |
| Footer | Done |
| Nav | Done |
| Waitlist form | Done |
| LiquidCrystal background | Done |
| ShinyButton CTA | Done |
| Leaderboard preview | Done |

**Next action**: Review for copy polish and responsive edge cases

## Dashboard (`/dashboard`)

**Status**: Complete (first pass)

| Item | State |
|------|-------|
| Account overview | Done |
| Stats panel | Done |
| Open positions table | Done |
| Pending orders table | Done |
| Trade history | Done |
| Order events (SSE) | Done |
| Connection status indicator | Done |
| Dashboard layout/composition | Done |
| use-dashboard hook (REST) | Done |
| use-dashboard-stream hook (SSE) | Done |

**Next action**: UI polish pass — loading states, empty states, responsive behavior

## Registration Flow (`/register`)

**Status**: Complete — 3-step flow, all screens built

| Item | State |
|------|-------|
| /register route + layout | Done |
| Tier data in lib/constants.js (TIERS) | Done (5% drawdown, Unlimited period, label/value format) |
| Stepper component (3-step, Phosphor Icons, Framer Motion) | Done (Phase 2: collapsed from 4 to 3 steps; Phase 3: mobile compact "Step X of 3" label) |
| Registration flow orchestrator (3-step) | Done (Phase 2: Select Plan → Connect & Pay → Confirmation; Phase 3: nav bar, beforeunload guard) |
| Tier selection step (interactive cards, selected state) | Done (label/value rows, Pro card elevated, promo banner) |
| A11y: ARIA radiogroup + keyboard nav on tier cards | Done |
| A11y: Semantic stepper (ol/li, aria-current) | Done |
| A11y: Screen reader pricing context (ins/del, sr-only) | Done |
| A11y: Focus-visible indicators, main landmark | Done |
| Touch target: All buttons 44px (h-11) | Done |
| Performance: targeted transitions (no transition-all) | Done |
| Contrast: brightened small muted text (oklch 0.65) | Done |
| Min font size: text-xs (12px) floor on all labels | Done |
| Email step | Removed (not in flow) |
| Connect & Pay step (merged wallet + payment) | Done (Phase 2: order summary, RainbowKit connect, alt wallet toggle, USDC payment, wagmi/viem fallback, x402 TODO) |
| Old step-hl-address.jsx | Deleted (absorbed into step-connect-pay.jsx) |
| Old step-payment.jsx | Deleted (absorbed into step-connect-pay.jsx) |
| Confirmation step | Done (Phase 3: success header, summary card with copy buttons, next steps, dashboard/leaderboard links) |
| Promo banner on tier selection | Done (Phase 3: "Launch pricing — up to 55% off") |
| Registration nav bar (logo + exit) | Done (Phase 3: replaces centered branding) |
| Browser refresh guard (payment only) | Done (Phase 3: beforeunload during processing) |
| Mobile stepper (compact label) | Done (Phase 3: "Step X of 3 — Label" below md) |
| Marketing CTAs linked to /register | Done |
| Harden: touch targets >= 44px (5 elements) | Done |
| Harden: shared utils in lib/format.js (no dupes) | Done |
| Harden: CopyButton a11y (dynamic aria-label, focus ring) | Done |
| Harden: promo banner text-balance (no nbsp) | Done |
| Harden: block explorer sr-only external indicator | Done |
| Harden: beforeunload design decision documented | Done |
| Polish: stepper completed nodes white/gray (not teal) | Done |
| Polish: selected tier card persistent glow + unselected dim | Done |
| Polish: Continue button shiny-cta when tier selected | Done |
| Polish: confirmation Chrome extension CTA (shiny-cta, prominent) | Done |
| Polish: "After you install" compact bullets (no numbered circles) | Done |
| Polish: "View Leaderboard" removed, "Go to Dashboard" secondary | Done |
| Polish: stepper collapsed to text on confirmation step | Done |
| Polish: spacing rhythm (explicit mt-* between sections) | Done |

**Next action**: UI polish pass across other pages

## Leaderboard (`/leaderboard`)

**Status**: Complete (first pass)

| Item | State |
|------|-------|
| Leaderboard page | Done |
| Mock miner data | Done |

**Next action**: Design polish, filtering/sorting, responsive layout

## Miner Detail (`/miner/[slug]`)

**Status**: Complete (first pass)

| Item | State |
|------|-------|
| Dynamic route | Done |
| Miner detail page | Done |

**Next action**: Design polish, PnL charts, performance metrics

## Status Page (`/status`)

**Status**: Complete (first pass)

| Item | State |
|------|-------|
| Status checker component | Done |
| Status API route | Done |

**Next action**: Polish, real-time refresh behavior

## Shared UI (`components/ui/`)

**Status**: Scaffolded

| Item | State |
|------|-------|
| Button | Done |
| Card | Done |
| Dialog | Done |
| Input | Done |
| Skeleton loader (CSS) | Done |

**Next action**: Audit components for consistency, add any missing primitives as needed

## Infrastructure

**Status**: Complete

| Item | State |
|------|-------|
| CLAUDE.md | Done |
| design-rules.md | Done |
| ARCHITECTURE.md | Done |
| BUILD_STATE.md | Done |
| Hooks (pre-write, post-edit) | Done |
| Phase notes | Done |

**Next action**: Begin Phase 1 — UI polish pass
