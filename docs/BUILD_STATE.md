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

**Status**: Phase 1 complete — tier selection UI

| Item | State |
|------|-------|
| /register route + layout | Done |
| Tier data in lib/constants.js (TIERS) | Done |
| Stepper component (4-step, Phosphor Icons, Framer Motion) | Done |
| Registration flow orchestrator (new 4-step) | Done |
| Tier selection step (interactive cards, selected state) | Done |
| Email step | Removed (not in new flow) |
| Wallet step | Pending (Phase 2) |
| Payment step | Pending (Phase 2) |
| Confirmation step | Pending (Phase 2) |
| Marketing CTAs linked to /register | Done |

**Next action**: Phase 2 — wallet connection + payment steps

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
