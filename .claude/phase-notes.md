# Hyperscaled — Phase Notes

## Current status

Registration Phase 3 complete. All 3 steps of the registration flow are fully built: Select Plan → Connect & Pay → Confirmation. Promo banner, nav bar, mobile stepper, and beforeunload guard all in place.

## Completed phases

- **Phase 0**: Initial build — marketing site, dashboard, leaderboard, miner detail, status page, registration flow, mock API routes, wallet connection
- **Registration Phase 1**: Route, stepper, tier selection UI — /register route with Providers layout, 4-step stepper (Phosphor Icons + Framer Motion), interactive tier cards (Starter $25K, Pro $50K, Elite $100K), TIERS data in lib/constants.js, marketing CTAs updated to link to /register, email step removed from flow
- **Registration Phase 1 Harden**: Accessibility + performance fixes — ARIA radiogroup with roving tabindex on tier cards, semantic stepper (ol/li + aria-current), ins/del + sr-only for pricing, focus-visible indicators, main landmark, 44px touch target on Continue, targeted transitions (no transition-all), brightened small muted text (oklch 0.65), text-xs (12px) floor on all labels, removed Framer Motion from card selected indicator
- **Registration Phase 2**: 3-step flow, tier polish, connect & pay
  - **Part A — Tier Data**: Tier data already correct from prior work (5% drawdown, Unlimited trading period, Account Scaling varies per tier, label/value row layout, Pro card elevated with md:scale-[1.02]).
  - **Part B — Collapse to 3 Steps**: Removed step-hl-address.jsx and step-payment.jsx. Merged wallet connection + payment into single step-connect-pay.jsx. Updated registration-flow.jsx to 3 steps (0–2). Updated STEP_LABELS to ["Select Plan", "Connect & Pay", "Confirmation"]. Stepper was already prop-driven — no stepper.jsx changes needed.
  - **Part C — Connect & Pay Step**: New step-connect-pay.jsx with: order summary card (tier name, account size, pricing with del/ins, rules summary), RainbowKit ConnectButton when not connected with explanatory copy, connected wallet display with green dot indicator, USDC balance display, "Trading from a different wallet?" toggle (aria-expanded, aria-controls, CaretDown icon) expanding manual HL address input with blur validation, pay button with skeleton shimmer processing state, CheckCircle success with 1.5s auto-advance, destructive error display with try-again, back button hidden during processing/success. Uses wagmi/viem USDC transfer as fallback (x402 TODO preserved). onPaymentComplete returns { txHash, hlAddress }.
- **Registration Phase 3**: Confirmation, promo banner, edge cases, cleanup
  - **Part A — Confirmation Step**: Rebuilt step-confirmation.jsx with: teal CheckCircle (fill, 64px), headline "You're in. Evaluation starts now.", subhead about provisioning, Framer Motion staggered entry (container + items), receipt-style summary card (plan, trading wallet with copy, tx hash with copy + block explorer link, provisioning status with pulse-teal dot), "What's next" section with 3 numbered steps (Chrome extension, start trading, profit target) as semantic ol, footer with "Go to Dashboard" (teal h-11) and "View Leaderboard" text link. copyToClipboard helper added to lib/utils.js. CopyButton swaps Copy → Check icon for 2s feedback.
  - **Part B — Edge Cases**: beforeunload guard fires only during payment processing (onPaymentProcessing callback from step-connect-pay). No guard on other steps. Direct URL /register always lands on step 0 (default state).
  - **Part B3 — Mobile Stepper**: Below md breakpoint, stepper shows "Step X of 3 — Label" compact text instead of full horizontal stepper. Uses hidden/flex responsive classes.
  - **Part C — Promo Banner**: Compact inline callout above tier selection headline: "Launch pricing — up to 55% off all evaluations" with bg-teal-400/10 text-teal-400 styling.
  - **Part D — Cleanup**: No orphaned files found (only 5 expected files in components/registration/). Replaced centered logo + "Vanta Trading · Entity Miner" with minimal nav bar (logo left, Exit button right). Marketing CTAs verified — Hero.jsx and Nav.jsx both use `<Link href="/register">` (same tab).

- **Registration Harden (Phase 2+3 Audit)**:
  - H1: Fixed 5 touch targets below 44px — Exit button h-9→h-11, CopyButton min-h-11 min-w-11, block explorer link min-h-11 min-w-11, "View Leaderboard" min-h-11, "Get the extension" min-h-11
  - H2: Deduplicated formatAccountSize and truncateAddress — moved to lib/format.js, removed inline defs from step-confirmation.jsx, step-connect-pay.jsx, step-select-tier.jsx
  - H3: CopyButton aria-label updates dynamically to "Copied" when in copied state
  - M1: CopyButton focus-visible ring already present (verified)
  - M2: Promo banner switched from &nbsp; to text-balance
  - M3: Block explorer link has sr-only "(opens in new tab)" text (ArrowSquareOut icon was already present)
  - M4: Added design decision comment documenting why beforeunload doesn't cover wallet connection

- **Registration Polish (Visual & UX)**:
  - Stepper: completed nodes changed from bg-teal-400 to bg-white/10 text-white (white/gray, not teal)
  - Tier cards: selected card has persistent hover glow (opacity-100); unselected cards dim to opacity-70
  - Continue button: switches from disabled muted Button to shiny-cta native button when tier selected
  - Confirmation rework: replaced numbered "What's next" list with prominent Chrome extension CTA (shiny-cta, GoogleChromeLogo icon, full-width) + compact "After you install" bullets (· prefix, no numbered circles). Removed "View Leaderboard" link. "Go to Dashboard" is now secondary outline button.
  - Stepper collapse: on confirmation step (step 2), stepper replaced with "Registration complete" teal text
  - Spacing rhythm: replaced space-y-* with explicit flex-col + mt-* gaps across all registration files (step-select-tier, step-connect-pay, step-confirmation, registration-flow)
  - Shared utils: formatAccountSize and truncateAddress imported from lib/format.js (dedup from harden)
  - Two-column confirmation: grid grid-cols-1 lg:grid-cols-2 gap-8 below success header. Left column = receipt card + "Go to Dashboard" text link. Right column = extension mockup + CTA + "After you install" bullets.
  - Extension UI mockup: static decorative component (aria-hidden) showing Hyperscaled header with Active dot, $50,000 account size, profit progress bar (4.2%/10%), drawdown bar (1.8%/5%), ETH-PERP position row. Rotated 2deg with shadow for depth.
  - "Go to Dashboard" changed from outline Button to plain text link with arrow icon below receipt
  - Confirmation container widened from max-w-3xl to max-w-5xl on step 2 to accommodate two-column layout

- **Phase 0 — Global Compliance + Design Rule Sweep**:
  Files changed: 17
  - `components/marketing/HowItWorks.jsx` — "Vanta Trading" → "Arcline Capital", Chrome Extension step → "Trade on Hyperliquid", text-[10px] ×4, transition-all ×1
  - `components/marketing/Leaderboard.jsx` — "Vanta Network" → "Hyperscaled network", text-[10px] ×6
  - `components/marketing/Hero.jsx` — Chrome Extension CTA → "View Leaderboard", removed DownloadSimple import, text-[10px] ×12
  - `components/marketing/Footer.jsx` — "Built on Bittensor" removed from tagline, copyright 2025→2026, transition-all ×1
  - `components/marketing/Solution.jsx` — "Up to 100%" → "100%" ×2 (compareRows + hsBest)
  - `components/marketing/Features.jsx` — "we bring the funding" → "the network provides funded account access", text-[10px] ×3, transition-all ×1
  - `components/marketing/Problem.jsx` — text-[10px] ×1, transition-all ×1
  - `components/marketing/WaitlistForm.jsx` — transition-all ×1
  - `components/marketing/Stats.jsx` — text-[10px] ×1
  - `components/marketing/TraderDashboard.jsx` — text-[10px] ×14, text-[9px] ×2, text-[8px] ×1
  - `components/registration/step-confirmation.jsx` — "Vanta Network Dashboard" → "Hyperscaled Dashboard", "Vanta Network" → "Hyperscaled"
  - `components/registration/step-connect-pay.jsx` — VANTA_USDC_WALLET → HYPERSCALED_USDC_WALLET
  - `components/dashboard/dashboard.jsx` — min-h-screen → min-h-[100dvh] ×5
  - `components/dashboard/account-overview.jsx` — transition-all ×2
  - `components/status/status-checker.jsx` — min-h-screen → min-h-[100dvh]
  - `app/leaderboard/page.jsx` — min-h-screen → min-h-[100dvh] ×2
  - `lib/constants.js` — VANTA_USDC_WALLET → HYPERSCALED_USDC_WALLET
  - `lib/db/seed.js` — "Vanta Trading" / "vanta" → "Arcline Capital" / "arcline"
  - `endpoint_docs.md` — "Vanta Network API Endpoints" → "Hyperscaled API Endpoints"
  - `docs/COPY_DECK.md` — updated "Vanta" references to match new names

  Fix counts:
  - Vanta references removed: 9
  - Built on Bittensor removed: 1 (tagline; "Powered by" kept in footer + hero)
  - Up to 100% fixed: 2
  - Chrome Extension refs removed: 2 (hero CTA + HowItWorks step)
  - Funding language fixed: 1
  - Copyright year fixed: 1
  - text-[10px] fixed: 41 (all replaced with text-xs)
  - text-[9px] fixed: 2, text-[8px] fixed: 1 (also bumped to text-xs)
  - transition-all fixed: 7
  - min-h-screen fixed: 8

  Intentionally left:
  - Chrome Extension in registration confirmation (step-confirmation.jsx lines 382, 396) — flagged as open decision #2 in PHASES.md
  - "vanta-cli" references in endpoint_docs.md — these refer to the external CLI tool, not the product brand

- **Phase 1 — Nav + Footer Overhaul**:
  Files changed: 3 (Nav.jsx, Footer.jsx, TODO_POLISH.md)
  Files created: 3 (app/terms/page.jsx, app/privacy/page.jsx, app/risk/page.jsx)

  **Nav (before → after)**:
  - Before: 4 links (Protocol, Features, Dashboard, Status) using scroll anchors, "Extension" CTA, search input
  - After: 6 route-based links (How It Works, Pricing, Rules, Leaderboard, Partners, FAQ), "Start Evaluation" CTA linking to https://app.hyperscaled.trade (external), mobile hamburger menu (AnimatePresence), search removed (deferred to backlog)

  **Footer (before → after)**:
  - Before: Single-row with dead social links, "Built on Bittensor" tagline, © 2025
  - After: 4-column grid (Brand, Protocol, Community, Legal). Brand column has logo + tagline + social icon buttons. Protocol column has 6 links (How It Works, Pricing, Rules, Leaderboard, Evaluation Rules, Docs). Community column has Twitter/X, Discord, GitHub with icons. Legal column has Terms, Privacy, Risk Disclosure, Audit Report. Bottom bar: "© 2026 Hyperscaled. All rights reserved." + "Built on Hyperliquid · Powered by Bittensor". Internal links use Next.js Link, external use target="_blank". Placeholder URLs have TODO comments.

  **Legal placeholder pages**: /terms, /privacy, /risk — minimal pages with metadata, min-h-[100dvh], "Coming soon." text.

  **TODO_POLISH.md**: Created to track deferred items — missing URLs (Twitter, Discord, GitHub, Docs, Audit Report), nav search field, legal page content.

  **Decisions**:
  - Nav search removed from Phase 1 scope — needs UX decision on cross-page behavior
  - All social/external URLs use # placeholder with TODO comments
  - CTA points to https://app.hyperscaled.trade (external app), not /register
  - Nav links are all route-based (no scroll anchors)

- **Phase 2 — Shared Constants + Components**:
  Files changed: 4 (lib/constants.js, Stats.jsx, Hero.jsx, FAQ.jsx)
  Files created: 3 (components/shared/ScalingPathVisual.jsx, FAQAccordion.jsx, RulesTable.jsx)

  **Constants added to lib/constants.js**:
  - NETWORK_STATS — 5 stats (value/label/description) for Stats section + reuse
  - HERO_STATS — 3 inline stats for Hero section
  - EVAL_RULES — 8 evaluation phase rules (rule/parameter)
  - FUNDED_RULES — 7 funded account rules (rule/parameter)
  - SCALING_PATH — 9 steps from $100K → $2.5M (from/to)
  - SCALING_MILESTONES — 12 milestones from $25K → $2.5M
  - PRICING_TIERS — 3 tiers with full spec details (launch/standard pricing, targets, drawdowns, CTAs)
  - FAQ_ITEMS — 5 categories, 22 total FAQ entries with id/question/answer
  - HOME_FAQ_IDS — 5 IDs for Home page condensed FAQ
  - PRICING_FAQ_IDS — 3 IDs for Pricing page mini FAQ
  - PRICING_FAQ — 3 pricing-specific FAQ entries

  **Existing components updated**:
  - Stats.jsx — imports NETWORK_STATS, parses value strings into rawNum/prefix/suffix for counter animation
  - Hero.jsx — imports HERO_STATS, replaces hardcoded `stats` array
  - FAQ.jsx — imports FAQ_ITEMS + HOME_FAQ_IDS, filters flat items by ID subset

  **New shared components created**:
  - ScalingPathVisual.jsx — horizontal stepped bar chart from SCALING_MILESTONES, Framer Motion staggered entry, optional highlightFrom prop, big-jump indicators at $750K/$1M, responsive horizontal scroll on mobile
  - FAQAccordion.jsx — reusable accordion with single-item-open, optional `grouped` prop for category headings, CaretDown icon with rotation, teal active state, aria-expanded + aria-controls + role="region", Framer Motion height animation
  - RulesTable.jsx — two-column table (desktop) / stacked cards (mobile), optional label prop, dark theme with subtle borders

  **Decisions**:
  - FAQ answers use \u00a0 (non-breaking space) before last word to prevent typographic widows
  - Stats component preserves existing counter animation by parsing NETWORK_STATS value strings
  - ScalingPathVisual uses non-linear bar heights (32px base + 10px per step) to visually communicate scaling

- **Phase 3 — Home Page Overhaul**:
  Files changed: 7 (Hero.jsx, Stats.jsx, Problem.jsx, Solution.jsx, HowItWorks.jsx, Features.jsx, FAQ.jsx, marketing.jsx)
  Files created: 1 (components/marketing/PartnersCTA.jsx)

  **Hero**:
  - Primary CTA → external `https://app.hyperscaled.trade` (anchor, not Link)
  - Secondary CTA → "Learn More" linking to `/how-it-works`
  - Widget header: removed "HL · Bittensor", replaced with "7d cycle"
  - Updated subheadline copy per spec

  **Stats**: Removed all badges (STAT_BADGES set to null array). Still imports from NETWORK_STATS.

  **Problem**: Changed from asymmetric 2+1 grid to 3 equal columns (`md:grid-cols-3`). Removed `body2` field. Added standalone teal callout bar at bottom. Updated tags and copy per spec.

  **Solution/Protocol**: Changed from 3-column comparison (Hyperscaled/FTMO/Typical) to 2-column (Hyperscaled/FTMO). Added new rows: Profit Target, Evaluation, Weekend Trading. Changed LockOpen → Fingerprint icon. Updated payout copy to "7-day cycle". Added ✅ checkmarks via `Set` lookup. Added full-width banner tagline above ("Permissionless. Open-Source. Onchain.").

  **HowItWorks**: 3 new steps with mockup components:
  - Step 01: "Start Your Evaluation" + TierSelectorMockup ($25K/$50K/$100K)
  - Step 02: "Trade on Hyperliquid" + DashboardMockup (status + progress)
  - Step 03: "Hit the Target. Get Paid." + PayoutMockup (bar chart + payout row)
  - Icons: CurrencyDollar, TrendUp, Trophy

  **Features**: All 6 cards rewritten per spec. "Grow Your Account" card uses ScalingPathVisual from shared components.

  **PartnersCTA** (new): Dark card section between Features and FAQ. "FOR OPERATORS & INSTITUTIONS" label, "Run your own funded trading firm." headline, CTA linking to /partners.

  **FAQ**: Added `Link` import, "View full FAQ →" link to `/faq` in left sticky panel.

  **Responsive**: Verified at 375px (mobile), 768px (tablet), 1280px (desktop). No horizontal overflow, cards stack on mobile, comparison table readable, text legible at all breakpoints.

- **Phase 4 — Pricing Page**:
  Files changed: 3 (Footer.jsx, TODO_POLISH.md, PHASES.md)
  Files created: 2 (app/pricing/page.jsx, components/marketing/PricingPage.jsx)

  **Step 0 — Nav + Footer URL Patch**:
  - Social icons (brand column): Twitter→x.com/hyperscaledhq, Discord→discord.gg/hyperscaledhq, GitHub→github.com/taoshidev. Added aria-label to each.
  - Community column links: same URLs, plus new "Contact Support" → mailto:support@hyperscaled.trade
  - Protocol column: Docs → https://docs.taoshi.io (external, target="_blank")
  - Legal column: Audit Report removed entirely (no report exists)
  - mailto links: excluded from target="_blank" and ArrowUpRight icon treatment
  - TODO_POLISH.md: 5 URL items marked resolved, only "Nav search field" remains pending
  - Verified: zero `href="#"` remaining in Nav.jsx and Footer.jsx

  **Pricing Page**:
  - Page route: app/pricing/page.jsx with metadata, imports PricingPage component
  - No Providers wrapper (marketing page, no wallet connection)
  - LaunchBanner: teal-400/10 bg, centered text with green dot indicator, "Save up to 50%" copy
  - PricingHero: "One fee. One evaluation. Keep everything you earn." + subtext
  - PricingCards: 3-column grid from PRICING_TIERS, $50K card has shiny-border + "Most Popular" pill badge. Each card: tier name, launch price (ins) + strikethrough standard (del) + sr-only context, 7 detail rows (account size, profit target with $amount, drawdown with $limit, profit split, payout cycle, scaling path, time limit), CTA button linking to app.hyperscaled.trade. Popular card CTA uses shiny-cta class.
  - WhatsIncluded: 7 items with CheckCircle icons in a flex-wrap centered row
  - ScalingSection: headline + body + ScalingPathVisual from shared components
  - PricingFAQSection: "Common questions" heading + FAQAccordion with 3 PRICING_FAQ items
  - All sections use Framer Motion useInView for entrance animations
  - Responsive: cards stack single-column on mobile, flex-wrap on included items

  **Decisions**:
  - Popular card uses shiny-border (animated border class), non-popular cards use plain border
  - Pricing uses ins/del with sr-only for screen reader context (per design-rules.md)
  - Contact Support uses plain <a> (no target="_blank" for mailto)

- **Phase 5 — How It Works Page**:
  Files created: 2 (app/how-it-works/page.jsx, components/marketing/HowItWorksPage.jsx)

  **Step 0 — CTA Link Fix**: Changed all generic "Start Your Evaluation" / "Start Evaluation" CTAs from external app.hyperscaled.trade to /register. Affected: Nav.jsx, Hero.jsx, HowItWorksPage.jsx (hero + bottom CTA). PricingPage tier-specific CTAs kept external (correct). Rule: generic "Start Your Evaluation" → /register, tier-specific "Start $25K Evaluation" → https://app.hyperscaled.trade.

  **Page Hero**: Headline "From Hyperliquid trader to funded account — here's exactly how it works.", subtext about no API keys/custody/separate platform, CTA to /register.

  **4-Step Flow**: Full-width cards with left text + right key details box.
  - Step 01: Register and Select Account Size (4 detail rows: sizes, fee, KYC, activation)
  - Step 02: Trade on Hyperliquid (4 rows: platform, data access, custody, minimum capital)
  - Step 03: Track Your Progress (3 rows: dashboard, updates, tracked metrics)
  - Step 04: Pass, Get Funded, Get Paid (9 rows: profit target, drawdown eval/funded, payout cycle, profit split, max size, funded profit target, scaling qualification, bonus qualification)

  **Scaling Path Visual**: Reuses ScalingPathVisual from shared components. Includes note about Tier I/II scaling to $100K before full path applies.

  **Non-Custodial Explainer**: "WHY THIS IS DIFFERENT" label, "Your wallet. Your trades. Your keys." headline, 3-paragraph body, two-column comparison (Legacy Prop Firm with XCircle red icons vs Hyperscaled with CheckCircle teal icons, 4 items each).

  **Payout Mechanics**: "PAYOUT MECHANICS" label, "Automated. Onchain. Every 7 days." headline, 2-paragraph body (includes KYC note), horizontal 5-node flow diagram (stacks vertically on mobile), teal callout box "100% of profits go to you."

  **Bottom CTA**: "Ready to start?" headline, subtext, primary shiny-cta to app.hyperscaled.trade, secondary "View Pricing" link to /pricing.

  **Responsive**: All step cards stack text above details on mobile. Comparison columns stack on mobile. Payout flow stacks vertically on mobile. CTAs centered on all breakpoints.

  **Patterns**: Uses same spring animation config as PricingPage. useInView for scroll-triggered animations. Framer Motion enter transitions on all sections. &nbsp; for widow prevention. textWrap: 'balance' on body copy.

- **Phase 6 — Rules Page**:
  Files created: 2 (app/rules/page.jsx, components/marketing/RulesPage.jsx)

  **Page Hero**: "The rules. All of them. No fine print." + subtext about protocol enforcement.

  **Evaluation Rules**: EVALUATION PHASE label, intro text, RulesTable with EVAL_RULES (8 rows), red breach callout box with Warning icon.

  **Funded Account Rules**: FUNDED ACCOUNT PHASE label, intro text, RulesTable with FUNDED_RULES (7 rows).

  **Scaling Rules**: ACCOUNT SCALING label, body text, two qualification blocks (5% quarterly + Sharpe > 1 for scaling, 2% quarterly + Sharpe > 1 for 25% bonus), tier note (Tier I/II cap at $100K, Tier III scales to $2.5M), custom From/To table with SCALING_PATH (9 rows, desktop table + mobile cards with ArrowRight), ScalingPathVisual component.

  **Disqualification**: Two-column layout (stacks on mobile). Left: "What causes disqualification" with XCircle red icons (3 items). Right: "What does not cause disqualification" with CheckCircle teal icons (6 items). Same pattern as HowItWorksPage non-custodial comparison.

  **KYC & Payouts**: KYC & PAYOUTS label, two paragraphs about KYC-only-for-payouts and wallet verification flow.

  **Protocol Transparency**: PROTOCOL label, body about programmatic enforcement, "Start Your Evaluation →" CTA linking to /register (shiny-cta).

  **Patterns**: No scroll animations — this is the one page with zero Framer Motion (restraint = authority). &nbsp; for widow prevention. textWrap: 'balance' on hero. All sections use max-w-[900px] container (slightly narrower than other pages to suit text-heavy content).

- **Phase 6b — Rules Page Polish**:
  Files changed: 2 (components/marketing/RulesPage.jsx, app/globals.css)

  **Sticky TOC**: Desktop = fixed left sidebar with IntersectionObserver-driven active state highlight. Mobile = sticky horizontal pill bar below nav with horizontal scroll (scrollbar-hide utility added to globals.css). Both use anchor links to section IDs with scroll-mt-24.

  **Section headings**: Added h2 below every teal label — "Evaluation Rules", "Funded Account Rules", "Scaling Rules", "Disqualification", "KYC & Payout Eligibility", "Protocol Transparency". Style: text-2xl font-bold tracking-tight.

  **Removed all animations**: Stripped every useInView, motion.div, and Framer Motion import. All sections render immediately. Only import remaining is framer-motion-free. This page is now the only marketing page with zero motion — intentional restraint for protocol documentation tone.

  **Scaling qualifications in callout boxes**: Replaced plain h3 + bullet list with two side-by-side bordered callout boxes. Scaling qualification = teal-tinted border + bg. Bonus qualification = neutral border. Both use CheckCircle icons instead of middot bullets.

  **KYC section visual weight**: Body text wrapped in bordered card container (rounded-xl border bg-white/[0.02]).

  **Protocol section visual weight**: Body text wrapped in teal-tinted callout box (border-teal-400/20 bg-teal-400/[0.04]). Text color elevated to zinc-300.

  **Bottom CTA downgraded**: Replaced shiny-cta button with plain teal text link "Start Your Evaluation →". On-brand for documentation tone — no flourishes.

  **Minor fixes**: Deleted unused SCALING_TABLE_ROWS const. Added disqualification intro text. Fixed &amp; to & in KYC label. Replaced middot bullets with CheckCircle icons in scaling qualifications.

- **Phase 7 — FAQ Page**:
  Files created: 2 (app/faq/page.jsx, components/marketing/FAQPage.jsx)
  Files changed: 1 (components/shared/FAQAccordion.jsx)

  **Page Hero**: "Questions traders actually ask." + subtext about Hyperscaled Evaluation.

  **FAQ Accordion**: Uses FAQAccordion in grouped mode with new `sectionIds` prop. All 22 items across 5 categories rendered from FAQ_ITEMS constant. Single-open accordion behavior shared across all categories. Category headings rendered as h2 with section IDs for anchor linking.

  **Sticky TOC**: Matches Rules page pattern exactly. Desktop = fixed left sidebar with IntersectionObserver-driven active state. Mobile = sticky horizontal pill bar with horizontal scroll (scrollbar-hide). Both use anchor links to category section IDs with scroll-mt-24.

  **Contact Section**: Two links at bottom — "Still have questions? Join our Discord →" (teal, DiscordLogo icon, external) + "Email us →" (secondary, Envelope icon, mailto:support@hyperscaled.trade). Centered on mobile, side-by-side on desktop.

  **FAQAccordion Enhancement**: Added `sectionIds` prop to grouped mode. When enabled, generates slug IDs from category names and adds scroll-mt-24 for anchor offset. Changed grouped heading from h3 to h2 for proper document outline. Only the FAQ page uses grouped mode.

  **Patterns**: No scroll animations — matches Rules page documentation tone. &nbsp; for widow prevention. textWrap: 'balance' on hero. max-w-[900px] content container. No shiny-cta, no Framer Motion entrance animations.

## In progress

Nothing currently in progress.

## Next action

Phase 8 — Partners Page (see docs/PHASES.md).

## Known issues

- x402 payment flow requires a server-side 402 endpoint — using direct USDC transfer via wagmi/viem as fallback until API is confirmed
- No loading/skeleton states on dashboard widgets (spinners may exist — need to swap to skeletons)
- Responsive behavior untested across all pages
- Dark mode is hard-coded (CSS variables set to dark only) — light mode decision pending
- Two icon libraries in use (Phosphor + Lucide) — need to standardize on Phosphor for new work
- Pre-existing build error: apple-icon.png and favicon.ico cause PageNotFoundError during `next build` (not from our changes)
- WalletConnect requires NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID in .env.local to run dev server

## Decisions made

- Tailwind v4 CSS-based config (no tailwind.config.js)
- Satoshi as primary typeface
- Teal (#00C6A7) as brand accent
- Mock data throughout — no backend integration yet
- Providers wrapper applied per-layout, not in root layout (marketing stays static)
- Registration flow is now 3 steps: Select Plan → Connect & Pay → Confirmation (collapsed from 4)
- Connected wallet is used as both payment wallet AND HL trading wallet by default; optional toggle reveals manual address input
- TIERS array is single source of truth in lib/constants.js — uses label/value objects for details
- Hero CTA changed from WaitlistForm email capture to direct /register link
- Nav CTA changed from "Extension" to "Start Evaluation" linking to /register
- Payment uses direct USDC transfer (wagmi/viem) as fallback; x402 integration deferred until 402 endpoint exists
- VANTA_USDC_WALLET exposed as NEXT_PUBLIC env var with zero-address default
- Confirmation step passes currentStep=3 to stepper to show all steps as complete
- Registration nav bar: logo (links home) + "Exit" ghost button (links home), replaces centered branding
