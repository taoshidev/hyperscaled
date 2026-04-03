# Build State

Last updated: 2026-03-26

## Marketing Site (`/`)

**Status**: Complete — Phase 3 home page overhaul + Copy Review A + Updates B

| Item | State |
|------|-------|
| Hero + CTA | Done — Phase 3/5/CRA/UA: CTA to /register "Start Your Challenge", hero stats row (1-Step Challenge, 100% Profit Split, $30M+ Rewards) |
| How It Works (condensed 3-step) | Done — Phase 3/CRA/UB: second section after Hero |
| Full Pricing Cards | Done — UB: replaced PricingPreview with full detailed pricing cards (7 spec rows, Most Popular badge on $100K, tier-specific CTAs) |
| Features section | Done — Phase 3/CRA: 6 cards, copy shortened per copywriter review, removed "Dispute resolution" bullet |
| The Hyperscaled Protocol (comparison) | Done — Phase 3/CRA: "Decentralized. Transparent.", KYC None→No |
| The Problem | Done — Phase 3/CRA/UB: copy updated, callout bar "pays out 100% of rewards to traders" |
| For Operators & Institutions | Done — Phase 3: links to /partners |
| FAQ | Done — Phase 3: "View full FAQ →" link added to sticky sidebar |
| Stats section | Removed — UB: Network Stats Bar removed as standalone section (key stats already in hero row) |
| PricingPreview | Removed — UB: replaced by full pricing cards |
| Footer | Done — 4-column layout (Brand, Protocol, Community, Legal), social icons, "Built on Hyperliquid · Powered by Bittensor", © 2026. Phase 4: URLs patched. Link audit: Docs link removed, duplicate Challenge Rules removed, For Agents added, Discord URLs corrected to discord.gg/hyperscaledhq. |
| Nav | Done — UA: 7 links + Extension CTA + "Start Challenge" CTA → /register, progressive responsive collapse. Link audit: Chrome Extension URL now uses CHROME_EXTENSION_URL constant (full extension path). |
| Waitlist form | Done (to be removed) — spec has no waitlist form |
| LiquidCrystal background | Done |
| ShinyButton CTA | Done |
| Leaderboard preview | Not on home page — Component exists at `/leaderboard` but is NOT rendered in the home page marketing compose list (`components/marketing.jsx`). Spec does not require it on home page. |
| Compliance (copy/design rules) | Done — 72 violations fixed (9 Vanta, 1 Built on Bittensor, 2 Up to 100%, 2 Chrome Extension, 1 funding language, 1 copyright, 41 text-[10px], 7 transition-all, 8 min-h-screen) |
| Missing pages | Done — `/pricing` (Phase 4), `/how-it-works` (Phase 5), `/rules` (Phase 6), `/faq` (Phase 7), `/partners` (Phase 8). All marketing pages complete. |
| Legal pages (`/terms`, `/privacy`, `/risk`) | Done — placeholder pages with "Coming soon." Content pending. |
| TODO Polish tracker | Done — `docs/TODO_POLISH.md` tracks deferred URLs + legal content |

## Pricing Page (`/pricing`)

**Status**: Complete — Phase 4 + Copy Review A

| Item | State |
|------|-------|
| Page route + metadata | Done |
| Launch pricing banner | Done — CRA: updated to "Save up to 50% for a limited time" |
| Page hero | Done — CRA: subtext "take the Hyperscaled challenge. No hidden fees." |
| 3-tier pricing cards (shiny-border on popular) | Done — CRA: Most Popular moved to $100K, tier I/II scaling → $100K, payout cycle → Weekly |
| What's Included feature grid | Done — CRA: replaced badge row with 6-card grid (icons + title + desc) |
| A Model Built for Traders section | Done — CRA: bullet list + EvalProgressWidget mockup |
| Scaling path visual | Done |
| Pricing FAQ mini (3 items) | Done |
| Responsive layout | Done |

**Next action**: Copy Review Session B next.

## How It Works Page (`/how-it-works`)

**Status**: Complete — Phase 5 + Copy Review B + Updates B

| Item | State |
|------|-------|
| Page route + metadata | Done |
| Page hero + CTA | Done — CRB: headline "Trade on Hyperliquid. Get funded by the network.", subtext shortened |
| 4-step flow (register, trade, track, pass) | Done — CRB/UB: all titles/bodies/details rewritten, step 01 has "Get started" CTA, step 02 Minimum Trading Capital row removed |
| Key details boxes per step | Done — CRB: simplified labels, Chrome Plugin mention |
| Scaling path visual + tier note | Done — CRB: body shortened |
| Non-custodial explainer + comparison | Done — CRB/UB: callout bar above comparison, spacing tightened (mb-6) |
| Payout mechanics + flow diagram | Done — CRB: headline "Automated. Weekly. Onchain.", body + KYC note shortened |
| Callout box (100% profit) | Done |
| PricingPreview widget | Done — CRB: added between payout mechanics and bottom CTA |
| Bottom CTA | Done — CRB: removed "View Pricing" link |
| Responsive layout | Done |

**Next action**: Polish pass next.

## Rules Page (`/rules`)

**Status**: Complete — Phase 6 + Copy Review B

| Item | State |
|------|-------|
| Page route + metadata | Done |
| Page hero | Done — CRB: "Rules and Trading Objectives", subtext shortened |
| Evaluation rules table (EVAL_RULES) | Done — CRB: added Consistency Criteria + Weekend Trading rows |
| Breach callout box | Done |
| Funded account rules table (FUNDED_RULES) | Done — CRB: removed redundant Drawdown Limit row |
| Scaling rules (qualifications, bonus, tier note) | Done |
| Scaling path table (SCALING_PATH) | Done |
| Scaling path visual | Removed — CRB: table is sufficient on this documentation page |
| Disqualification rules (does/does not, side-by-side) | Done |
| Section headings | Done — CRB: removed redundant h2 headings (kept teal labels as anchors) |
| KYC & payouts section | Done |
| Protocol transparency + CTA | Done |
| Responsive layout | Done |

**Next action**: All copywriter changes applied. Polish pass next.

## FAQ Page (`/faq`)

**Status**: Complete — Phase 7

| Item | State |
|------|-------|
| Page route + metadata | Done |
| Page hero | Done |
| FAQ accordion (grouped, 5 categories, 22 items) | Done |
| Sticky sidebar TOC (desktop) + mobile pill bar | Done |
| IntersectionObserver active section tracking | Done |
| Bottom contact links (Discord + email) | Done |
| Responsive layout | Done |

**Next action**: All marketing pages complete. Polish pass next.

## Partners Page (`/partners`)

**Status**: Complete — Phase 8 + Copy Review B + Updates B

| Item | State |
|------|-------|
| Page route + metadata | Done |
| Page hero | Done — CRB: removed badge pill, body copy combined |
| What You Control (6 feature cards) | Done — CRB: feature 6 body updated |
| Revenue model (USDC + Alpha, mental model callout) | Done — CRB: stream 2 body updated |
| How It Works (4-step vertical timeline) | Done — CRB: steps 1 + 4 body updated |
| Division of responsibility (two-column) | Done — CRB: headline "Designed for your success.", handles bullet updated |
| Funding capacity table | Removed — UB: entire section removed (teal label, heading, body, table, footnote) |
| Application CTA | Done — CRB: body shortened |
| Trust signals | Done — CRB: 4 compact indicators below CTA button |
| Responsive layout | Done |

**Next action**: Polish pass next.

## Shared Constants (`lib/constants.js`)

**Status**: Done

| Item | State |
|------|-------|
| NETWORK_STATS | Done — 5 stats (value/label/description). UB: label "Rewards Distributed" → "Network Rewards Distributed" |
| HERO_STATS | Done — CRA/UA: 1-Step Challenge, 100% Profit Split, $30M+ Rewards |
| EVAL_RULES | Done — 10 challenge rules (UA: Evaluation→Challenge rename) |
| FUNDED_RULES | Done — 7 funded account rules |
| SCALING_PATH | Done — 9 steps ($100K → $2.5M) |
| SCALING_MILESTONES | Done — 12 milestones ($25K → $2.5M) |
| PRICING_TIERS | Done — CRA: popular moved to tier-3, tier I/II scaling → $100K, payout → Weekly |
| FAQ_ITEMS | Done — 5 categories (UA: "The Evaluation"→"The Challenge"), 22 entries. UB: removed minimum-capital, added trading-pairs |
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

**Status**: Complete — wallet lookup added, metadata updated

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
| Wallet address lookup | Done — "or look up an address" input in disconnected state, submits to same data flow as connected wallet |
| Page metadata + OG | Done — title template, description, openGraph |

**Next action**: UI polish pass — loading states, empty states, responsive behavior

## Registration Flow (`/register`)

**Status**: Complete — 4-step flow (Select Plan → Connect & Pay → Confirm → Done)

| Item | State |
|------|-------|
| /register route + layout | Done |
| Tier data in lib/constants.js (TIERS) | Done (5% drawdown, Unlimited period, label/value format) |
| Stepper component (4-step, Phosphor Icons, Framer Motion) | Done (Phase 1 confirm: expanded to 4 steps; mobile "Step X of 4" label) |
| Registration flow orchestrator (4-step) | Done (Select Plan → Connect & Pay → Confirm → Done; nav bar, beforeunload guard) |
| Tier selection step (interactive cards, selected state) | Done (label/value rows, Pro card elevated, promo banner) |
| A11y: ARIA radiogroup + keyboard nav on tier cards | Done |
| A11y: Semantic stepper (ol/li, aria-current) | Done |
| A11y: Screen reader pricing context (ins/del, sr-only) | Done |
| A11y: Focus-visible indicators, main landmark | Done |
| Touch target: All buttons 44px (h-11) | Done |
| Performance: targeted transitions (no transition-all) | Done |
| Contrast: brightened small muted text (oklch 0.65) | Done |
| Min font size: text-xs (12px) floor on all labels | Done |
| Email field | Removed — Phase 1 confirm: removed from flow, state, validation, and all payment handlers |
| Connect & Pay step | Done (Phase 1 confirm: HL wallet with Auto-detect, payment method selector, wallet connection, Continue to review) |
| Confirm step (new) | Done — Phase 1 confirm: review card with trading wallet, inline-editable payout wallet, plan summary, confirmation checkbox, pay button |
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
| EIP-712 usdSend payment (Phase 2) | Done — replaced sendAsset with native usdSend EIP-712 typed signature; lib/hl-payment.js utility (buildUsdSendTypes, buildUsdSendDomain, buildUsdSendMessage, submitUsdSend); inline progress steps (Signing → Submitting → Verifying → Provisioning); backend TODO comment for WebSocket listener; env vars NEXT_PUBLIC_HL_RECEIVING_WALLET + NEXT_PUBLIC_HL_CHAIN |
| Pay with Wallet (Base path) | Still working — untouched in Phase 2 |
| Pay with Hyperliquid (extension path) | Still working — untouched in Phase 2 |
| Extension decoupled from payment (Phase 3) | Done — removed "Send via Extension" payment option, removed extension detection gating from payment flow, extension CTA moved to success screen as first content block, conditional display (install CTA vs "ready to trade" confirmation), 2-col payment grid |
| Success screen restructured (Phase 3) | Done — order: success header → extension CTA/confirmation → receipt card → dashboard link; useExtensionBridge in StepConfirmation for detection |
| Polish: HL wallet truncation + copy (Phase 4) | Done — truncated display with copy button when valid, click-to-edit, auto-collapse on blur/auto-detect |
| Polish: Help panel cleanup (Phase 4) | Done — removed "How it works" and "One signature" sections from payment-eip712 help, removed payment-hl (dead extension method), moved requirements inline under payment selector, updated "Getting Started" fastest-path steps |
| Polish: Payment card selected border (Phase 6) | Done — solid teal ring-[1.5px] on selected payment card alongside shiny-border effect |
| Polish: Auto-fill HL wallet on connect (Phase 6) | Done — wallet address auto-populates from connected wallet, "Change" button to clear and re-enter, "Connect wallet" button when disconnected, updated helper text |
| Polish: Remove copy button from Connect & Pay (Phase 6) | Done — copy button removed from HL wallet field, kept only on Confirm and success screens |
| Polish: Full EVM address on Confirm (Phase 6) | Done — full address in text-xs font-mono on confirm screen, break-all for mobile wrap |
| Polish: Remove Help sidebar (Phase 6) | Done — removed RegistrationHelpProvider, RegistrationSidebar, MobileHelpSheet from registration flow; single-column centered layout for steps 1-2 |

**Next action**: UI polish pass across other pages

## Leaderboard (`/leaderboard`)

**Status**: Complete — wallet search added, metadata added

| Item | State |
|------|-------|
| Leaderboard page | Done |
| Mock miner data | Done |
| Wallet address search | Done — search input above table, filters funded + challenge tabs by partial address match, ?addr= query param support, clear/reset, no-results state |
| Page metadata + OG | Done — title, description, openGraph with url in leaderboard layout.jsx |

**Next action**: Design polish, responsive layout

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

## Metadata + SEO

**Status**: Complete

| Item | State |
|------|-------|
| Root layout metadata (title template, description, metadataBase) | Done |
| OpenGraph defaults (site-wide og.png, siteName, type) | Done |
| Twitter card (summary_large_image, @hyperscaledhq) | Done |
| Favicon (app/favicon.png, app/favicon.ico, icons config) | Done |
| Per-page metadata (all 11 marketing pages + dashboard + register) | Done |
| Per-page openGraph (title, description, url) | Done |
| Link audit (dead links, Discord URLs, Docs removal) | Done |

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

**Next action**: Polish pass next
