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

**Status**: Phase 2 complete — correct tier data, wallet input, payment wiring

| Item | State |
|------|-------|
| /register route + layout | Done |
| Tier data in lib/constants.js (TIERS) | Done (Phase 2: corrected to 5% drawdown, Unlimited period, label/value format) |
| Stepper component (4-step, Phosphor Icons, Framer Motion) | Done |
| Registration flow orchestrator (new 4-step) | Done (Phase 2: wired all steps) |
| Tier selection step (interactive cards, selected state) | Done (Phase 2: label/value rows, Pro card elevated) |
| A11y: ARIA radiogroup + keyboard nav on tier cards | Done |
| A11y: Semantic stepper (ol/li, aria-current) | Done |
| A11y: Screen reader pricing context (ins/del, sr-only) | Done |
| A11y: Focus-visible indicators, main landmark | Done |
| Touch target: All buttons 44px (h-11) | Done |
| Performance: targeted transitions (no transition-all) | Done |
| Contrast: brightened small muted text (oklch 0.65) | Done |
| Min font size: text-xs (12px) floor on all labels | Done |
| Email step | Removed (not in new flow) |
| Wallet step (HL address input, validation, tier summary) | Done (Phase 2) |
| Payment step (order summary, RainbowKit, USDC transfer) | Done (Phase 2: wagmi/viem fallback, x402 TODO) |
| Confirmation step | Pending (Phase 3 — placeholder in place) |
| Marketing CTAs linked to /register | Done |

**Next action**: Phase 3 — confirmation step UI

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
