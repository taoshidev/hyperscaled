# Build State

Last updated: 2026-03-17

## Marketing Site (`/`)

**Status**: Complete — Phase 3 home page overhaul done

| Item | State |
|------|-------|
| Hero + CTA | Done — Phase 3: external CTA to app.hyperscaled.trade, "Learn More" secondary, updated widget header (7d cycle), updated subhead copy |
| Features section | Done — Phase 3: 6 cards rewritten per spec, ScalingPathVisual in "Grow Your Account" card |
| How It Works | Done — Phase 3: 3 new steps (Start Evaluation → Trade on Hyperliquid → Hit the Target), TierSelectorMockup, DashboardMockup, PayoutMockup |
| Problem / Solution | Done — Phase 3: Problem = 3 equal columns + teal callout bar. Solution = Hyperscaled vs FTMO comparison table (9 rows), 4 protocol pillars, banner tagline |
| Stats section | Done — Phase 3: badges removed, imports from NETWORK_STATS |
| FAQ | Done — Phase 3: "View full FAQ →" link added to sticky sidebar |
| PartnersCTA | Done — Phase 3: new section between Features and FAQ, links to /partners |
| Footer | Done — 4-column layout (Brand, Protocol, Community, Legal), social icons, "Built on Hyperliquid · Powered by Bittensor", © 2026. Placeholder URLs have TODO comments. |
| Nav | Done — 6 route-based links (How It Works, Pricing, Rules, Leaderboard, Partners, FAQ), "Start Evaluation" external CTA, mobile hamburger menu. Search removed (backlog). |
| Waitlist form | Done (to be removed) — spec has no waitlist form |
| LiquidCrystal background | Done |
| ShinyButton CTA | Done |
| Leaderboard preview | Not on home page — Component exists at `/leaderboard` but is NOT rendered in the home page marketing compose list (`components/marketing.jsx`). Spec does not require it on home page. |
| Compliance (copy/design rules) | Done — 72 violations fixed (9 Vanta, 1 Built on Bittensor, 2 Up to 100%, 2 Chrome Extension, 1 funding language, 1 copyright, 41 text-[10px], 7 transition-all, 8 min-h-screen) |
| Missing pages | Not Started — `/how-it-works`, `/pricing`, `/rules`, `/partners`, `/faq` |
| Legal pages (`/terms`, `/privacy`, `/risk`) | Done — placeholder pages with "Coming soon." Content pending. |
| TODO Polish tracker | Done — `docs/TODO_POLISH.md` tracks deferred URLs + legal content |

**Next action**: Phase 4 — Pricing Page (see docs/PHASES.md)

## Shared Constants (`lib/constants.js`)

**Status**: Done

| Item | State |
|------|-------|
| NETWORK_STATS | Done — 5 stats (value/label/description) |
| HERO_STATS | Done — 3 inline hero stats |
| EVAL_RULES | Done — 8 evaluation rules |
| FUNDED_RULES | Done — 7 funded account rules |
| SCALING_PATH | Done — 9 steps ($100K → $2.5M) |
| SCALING_MILESTONES | Done — 12 milestones ($25K → $2.5M) |
| PRICING_TIERS | Done — 3 tiers with full spec details |
| FAQ_ITEMS | Done — 5 categories, 22 entries |
| HOME_FAQ_IDS | Done — 5-item subset for home page |
| PRICING_FAQ / PRICING_FAQ_IDS | Done — 3 pricing-specific entries |

## Shared Components (`components/shared/`)

**Status**: Done

| Item | State |
|------|-------|
| ScalingPathVisual | Done — horizontal stepped bar, Framer Motion, highlightFrom prop |
| FAQAccordion | Done — single-open, grouped mode, a11y, Framer Motion |
| RulesTable | Done — desktop table / mobile stacked cards, label prop |

**Next action**: Mount on pages during Phases 4–8

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
| Polish: two-column confirmation layout (receipt left, extension right) | Done |
| Polish: extension UI mockup (account size, progress bars, position row) | Done |
| Polish: "Go to Dashboard" as secondary text link below receipt | Done |
| Polish: confirmation container widens to max-w-5xl on step 2 | Done |

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

**Next action**: See docs/PHASES.md for launch plan
