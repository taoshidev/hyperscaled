# Hyperscaled — Phase Notes

## Current status

Free $1K tier + builder-fee approval added to the registration flow (2026-04-23).

## Free tier + Builder Fee in Registration (2026-04-23)

### What changed
- **DB (prod)**: inserted a new `entity_tiers` row for the Vanta miner — `account_size=1000`, `price_usdc=0.00`, `profit_split=100`, `is_active=true`. Had to `setval('entity_tiers_id_seq', MAX(id))` first because the sequence was at 16 while max id was 17 (later vanta 5K/10K rows were inserted outside the sequence).
- **TIERS meta** in `lib/constants.js`: added a `{ id: "free", name: "Free", accountSize: 1000, fullPrice: 0, promoPrice: 0, ... }` entry ahead of the `nano` tier so `/api/miners/[slug]`'s `enrichTier` can resolve it.
- **New util** `lib/hl-builder-fee.js`:
  - `getCurrentBuilderFee(user)` — queries HL `/info` `maxBuilderFee` for `HYPERSCALED_BUILDER_ADDRESS`.
  - `ensureBuilderFeeApproved({ address, chainId, switchChainAsync, feeRate = "0.05%" })` — returns `{ skipped: true }` when an approval already exists; otherwise switches to Arbitrum, signs `HyperliquidTransaction:ApproveBuilderFee`, posts to `/exchange`. Does NOT switch back — callers handle that.
- **`components/registration/step-connect-pay.jsx`**:
  - Derives `isFree = Number(price) === 0`.
  - Order summary hides del/ins price row and renders "Free" as the total when free.
  - Payment method selector (`eip712`/`base` cards) is hidden when `isFree`.
  - Wallet connection block and payout wallet block appear when `isFree` regardless of paymentMethod.
  - New `handleFreeSignup` runs: tolt → `runPreflight` → `ensureBuilderFeeApproved` → `POST /api/register` with `paymentMethod: "free"`.
  - `handlePayEIP712` calls `ensureBuilderFeeApproved` after the chain switch to Arbitrum, before the usdSend signature. Reuses the Arbitrum session — no extra switching.
  - `handlePayBase` calls `ensureBuilderFeeApproved` before the x402 probe; wraps the call in a try/finally that switches back to the previous chain so the user can sign the Base x402 payment.
  - `eip712Step` adds a `"builderFee"` state rendered as "Preparing your account…".
- **`app/api/register/route.js`**: added a `paymentMethod === "free"` branch that validates `price === 0`, sets `txHash = "free-${ts}-${hlAddress.slice(2,10)}"`, picks `effectivePayoutAddress = payoutAddress || hlAddress`, then falls through to the user-upsert / miner-API / registration-insert logic. Rejects `paymentMethod: "free"` on any tier where the price is not zero.

### Key decisions
- Builder fee runs on the connected (payer) wallet, not on `hlWallet`. For the common case those match; the existing `walletMatchesHL` warning covers the cross-wallet case and we don't block registration on it (keeps parity with the prior payment flow).
- Skip-if-approved policy: we never overwrite an existing approval. A user who already set a different `maxFeeRate` (from `/builder`) keeps that rate.
- Free tier `tierIndex` is 0 (smallest account_size sorts first). The backend already uses `activeTiers[tierIndex]` resolved server-side, so this is safe as long as the DB row count matches what the client fetched — which it does because both go through the same `/api/miners/[slug]` → `enrichTier` path.
- Chose to synthesize a `txHash` for the free tier (`free-${ts}-${walletPrefix}`) rather than null because the `registrations_tx_hash_unique` index disallows duplicate hashes and the column is nullable in schema but every existing row has one.

### Files added / modified
- `lib/hl-builder-fee.js` (new)
- `lib/constants.js` — TIERS meta + Free entry
- `components/registration/step-connect-pay.jsx` — free-tier UI, builder-fee call sites, new handleFreeSignup
- `app/api/register/route.js` — free payment method branch
- `docs/BUILD_STATE.md` — registration flow table updated
- `.claude/phase-notes.md` — this entry

### Verified
- `/api/miners/vanta` returns the free tier at index 0 with `promoPrice: 0`.
- `/api/register/preflight` with `{ tierIndex: 0, accountSize: 1000 }` returns `{ ok: true, price: 0 }`.
- `/register` and `/builder` render 200 after changes.
- esbuild parse passes on all touched files.

## Builder Code Page (2026-04-22)

## Previous Builder Code Page (2026-04-22)

### What changed
- New route `/builder` with standalone layout wrapping `<Providers>` (wagmi + RainbowKit)
- New client component `components/builder/builder-code-form.jsx`:
  - Hero + explainer card describing builder codes
  - Wallet connect via RainbowKit `<ConnectButton />`
  - "Current approval" panel querying HL `/info` with `{ type: "maxBuilderFee", user, builder }`; skeleton loader, pulse-teal dot on active approval, refresh button
  - Fee rate input pre-filled `0.05%` (half the 0.1% perp cap); validates format, blocks >1% (spot cap), warns >0.1% (perp cap)
  - Sign button performs EIP-712 `HyperliquidTransaction:ApproveBuilderFee` signature (Arbitrum chain switch → signTypedData → POST `/exchange`), re-queries approval on success
  - aria-live status line for screen-reader progress
- New constant `HYPERSCALED_BUILDER_ADDRESS = "0x7939aF2C9889F59A96C3921B515300A9a70898BB"` in `lib/constants.js`

### Files added / modified
- `app/builder/layout.jsx` (new)
- `app/builder/page.jsx` (new)
- `components/builder/builder-code-form.jsx` (new)
- `lib/constants.js` — added `HYPERSCALED_BUILDER_ADDRESS`

### Verified
- `curl http://localhost:4568/builder` returns 200 with correct metadata and rendered card structure
- EIP-712 types match the Hyperliquid Python SDK's `sign_approve_builder_fee` (hyperliquidChain:string, maxFeeRate:string, builder:address, nonce:uint64)
- Signing flow mirrors the existing `handlePayEIP712` in `components/registration/step-connect-pay.jsx`

## Registration Phase 6 — Checkout UX Polish (2026-04-02)

## Registration Phase 6 — Checkout UX Polish (2026-04-02)

### What changed
- Selected payment card now shows solid teal ring-[1.5px] border in addition to shiny-border effect
- HL wallet address auto-fills from connected wallet on connect (no button press)
- "Auto-detect" replaced with "Change" (when populated) / "Connect wallet" (when disconnected)
- Copy button removed from HL wallet field on Connect & Pay step
- Full EVM addresses shown on Confirm screen (text-xs, break-all) instead of truncated
- Help sidebar (RegistrationSidebar, MobileHelpSheet, RegistrationHelpProvider) removed entirely from registration flow
- Steps 1-2 now use single-column centered layout (max-w-lg) instead of two-column with sidebar
- Helper text updated to match auto-fill behavior
- handleHelpFocus/handleHelpBlur calls removed from payment method selectors

### Files modified
- `components/registration/step-connect-pay.jsx` — wallet auto-fill, copy removal, full addresses, border, removed help hooks
- `components/registration/registration-flow.jsx` — removed sidebar/help imports, single-column layout

### Verified
- "Skip payment (dev only)" already gated behind `process.env.NODE_ENV === "development"`

## Registration Phase 4 — Polish Fixes (2026-04-02)

### What changed
- HL wallet address shows truncated with copy button when valid (click to edit)
- Removed "How it works" (4 steps) and "One signature, one transfer" sections from payment-eip712 help content
- Moved requirements text inline under payment method selector (visible when EIP-712 selected)
- Removed `payment-hl` help entry (dead extension payment method)
- Updated "Getting Started" fastest-path steps to reflect current flow (no extension install step)

### Files modified
- `components/registration/step-connect-pay.jsx` — wallet truncation UI, inline requirements hint
- `components/registration/help-content.jsx` — removed sections, removed payment-hl, updated default steps

## Registration Phase 3 — Decouple Extension from Payment (2026-04-02)

### What changed
- Removed "Send via Extension" payment method option entirely from Connect & Pay step
- Removed `extensionDetected` gating from `canPayHL` and `canContinueToConfirm`
- Removed extension detection status blocks (install prompt + "Extension detected" indicator) from Connect & Pay
- Removed `handlePayHL` handler, extension verification watcher, and related refs (`hlPaymentParamsRef`, `verificationRunRef`, `callbacksRef`)
- Removed unused imports: `CurrencyDollar`, `GoogleChromeLogo`, `ExtensionModal`, `useRef`, `initiatePayment`, `paymentStatus`, `paymentSenderAddress`, `registrationResult`
- Payment grid changed from 3-col to 2-col (only "Pay with Hyperliquid" + "Pay with Wallet")
- Success screen (`step-confirmation.jsx`) restructured:
  - Extension CTA is now the first content block after success header
  - If extension detected: shows "Extension installed — you're ready to trade" + prominent dashboard link
  - If not detected: shows install heading, description ("Required to participate"), full-width install button, "Available for Chrome and Brave"
  - Receipt card moved below extension CTA
  - Secondary "Go to Dashboard" text link shown only when extension not installed (when installed, the dashboard link is in the prominent CTA block)
- `useExtensionBridge` added to `StepConfirmation` for extension detection
- `isHLPayment` now includes `paymentMethod === "eip712"` (no explorer URL for HL payments regardless of method)

### Key decisions
- Extension detection kept via `useExtensionBridge` hook — only moved where it's evaluated (success screen, not payment flow)
- Extension bridge hook still runs its detection logic (DOM markers, postMessage pings) — no changes to `hooks/use-extension-bridge.js`
- `resetPaymentStatus` kept in step-connect-pay.jsx (used by Base payment method selection)

## Registration Phase 2 — usdSend EIP-712 (2026-04-02)

### What changed
- Created `lib/hl-payment.js` — utility functions for usdSend EIP-712 signing and submission
  - `buildUsdSendTypes()`, `buildUsdSendDomain()`, `buildUsdSendMessage()`, `submitUsdSend()`
- Replaced `sendAsset` action with `usdSend` in `handlePayEIP712` handler
  - `sendAsset` used spot-to-spot transfer with 8 typed fields
  - `usdSend` uses perps account transfer with 4 typed fields (simpler)
- Added inline progress steps during EIP-712 payment: Signing → Submitting → Verifying → Provisioning
  - Reuses existing `PaymentStep` component from extension flow
- Added `eip712Step` state to track progress granularity
- Added backend TODO comment in `lib/hl-payment.js` for WebSocket listener
- Added env vars `NEXT_PUBLIC_HL_RECEIVING_WALLET` and `NEXT_PUBLIC_HL_CHAIN` to `.env.example`
- Base and Extension payment paths untouched

### Key decisions
- Used existing `HL_SIGNING_CHAIN_ID`, `HL_CHAIN_NAME`, `HL_API_URL` from `lib/constants.js` rather than the `NEXT_PUBLIC_HL_CHAIN` env var pattern from the spec (avoids duplication)
- The `hl-payment.js` utility imports from constants rather than reading env vars directly
- Transfer hash lookup still checks `userNonFundingLedgerUpdates` but matches `type: "usdSend"` instead of `type: "send"`

## Previous status

Fixes batch complete. Payout frequency updated from monthly/7-day to monthly across all pages. Tradeable pairs added to EVAL_RULES. Telegram bot link in footer. Nav collapse tightened. Homepage Step 01/02 mockups fixed. Permissionless banner removed. Pricing emoji removed. Agents tags removed. Partners copy + spacing fixed.

## Fixes Batch Session (2026-03-28)

### Payout frequency: monthly → monthly
- Updated 20+ instances across lib/constants.js, lib/pricing.js, HowItWorks.jsx, HowItWorksPage.jsx, PricingPage.jsx, RulesPage.jsx, Solution.jsx, layout.jsx, and all page metadata
- FUNDED_RULES payout cycle → "Monthly", PRICING_TIERS payoutCycle → "Monthly"
- FAQ answers updated (7-day cycle → monthly cycle)
- Verified: only remaining "monthly" is sitemap.js changeFrequency (not payout-related)

### Other fixes
- Added Tradeable Pairs row to EVAL_RULES in lib/constants.js
- Footer: added Telegram Bot link with TelegramLogo icon to Community column
- Nav: Rules moved to always-visible group (md+), Partners/Dashboard/Leaderboard/FAQ collapse at xl
- Homepage Step 01: replaced price mockup with tier labels (Tier I · $25K, etc.)
- Homepage Step 02: "Challenge: Phase 1" → "Challenge: One-Step"
- Homepage: removed "Permissionless. Open-Source. Onchain." banner from Solution.jsx
- Pricing: removed 🟢 emoji from launch banner
- Agents: removed "Pydantic outputs", "Semantic errors", "Pre-submission rules" tags from bottom CTA
- Partners: added periods to "Set your profit split" and "Permissionless scaling" card bodies
- Partners: increased Division of Responsibility section spacing (pt-20 pb-24, mt-12 gap)

## Search + Meta + Links Session (2026-03-26)

### Wallet search — Leaderboard
- Added `searchQuery` state + `MagnifyingGlass`/`XCircle` search bar above table
- `useMemo` filters both scaled and challenge tables by partial address match (case-insensitive)
- Clear button resets search; "No results" state with "Show all traders" button
- `initialSearch` prop from page's `?addr=` query param auto-populates on load
- Removed unused `onSearch` prop from Nav

### Wallet search — Dashboard
- Added "or look up an address" divider + search form below ConnectButton in disconnected state
- `lookupAddr` + `lookupSubmitted` state — on submit, passes address to `useDashboardData` hook
- Same data flow as connected wallet, just uses typed address instead

### Metadata + OG Images
- Root layout: full metadata with `title.template`, `metadataBase`, `openGraph` (site-wide defaults), `twitter` card, `icons` pointing to `/favicon.png`
- All 11 marketing pages updated: title uses template format (no "| Hyperscaled" suffix needed), per-page `openGraph` with `title`, `description`, `url`
- Created `app/leaderboard/layout.jsx` for metadata (page is `'use client'`)
- Home page `(marketing)/page.jsx` gets explicit openGraph
- Removed Figma MCP capture script from layout head

### Link Audit — Issues Found & Fixed
1. **Hero.jsx** — `href="#"` on "View Full Analytics" → changed to `/leaderboard`
2. **Nav.jsx** — Chrome Web Store bare domain → now uses `CHROME_EXTENSION_URL` constant (full extension URL)
3. **Footer.jsx** — Removed `Docs` link (`docs.taoshi.io`), removed duplicate `Challenge Rules` link, added `For Agents` link instead
4. **Footer.jsx** — Discord URL `discord.com/invite/GsqbQHu5UD` → `discord.gg/hyperscaledhq`
5. **FAQ.jsx** — Discord URL fixed (same)
6. **FAQPage.jsx** — Discord URL fixed (same)
7. **Leaderboard.jsx** — Fixed `text-[10px]` → `text-xs` on network stats labels

### Link Audit — Verified OK
- All "Start Challenge" / "Start Your Challenge" CTAs → `/register` (internal Link) ✓
- All tier-specific "Start $XXK Challenge" CTAs → `https://app.hyperscaled.trade` (external) ✓
- Twitter/X → `https://x.com/hyperscaledhq` ✓
- GitHub → `https://github.com/taoshidev` ✓
- `mailto:support@hyperscaled.trade` ✓
- `mailto:partners@hyperscaled.trade` ✓
- All external links have `target="_blank"` + `rel="noreferrer"` ✓
- No "Evaluation" text remaining (all renamed to "Challenge") ✓
- No double arrows on any button ✓

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
  - `components/marketing/Features.jsx` — "we bring the funding" → "the network provides scaled account access", text-[10px] ×3, transition-all ×1
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
  - FUNDED_RULES — 7 scaled account rules (rule/parameter)
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

  **PartnersCTA** (new): Dark card section between Features and FAQ. "FOR OPERATORS & INSTITUTIONS" label, "Run your own scaled trading firm." headline, CTA linking to /partners.

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

  **Page Hero**: Headline "From Hyperliquid trader to scaled account — here's exactly how it works.", subtext about no API keys/custody/separate platform, CTA to /register.

  **4-Step Flow**: Full-width cards with left text + right key details box.
  - Step 01: Register and Select Account Size (4 detail rows: sizes, fee, KYC, activation)
  - Step 02: Trade on Hyperliquid (4 rows: platform, data access, custody, minimum capital)
  - Step 03: Track Your Progress (3 rows: dashboard, updates, tracked metrics)
  - Step 04: Pass, Get Funded, Get Paid (9 rows: profit target, drawdown eval/scaled, payout cycle, profit split, max size, scaled profit target, scaling qualification, bonus qualification)

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

- **Phase 8 — Partners Page**:
  Files created: 2 (app/partners/page.jsx, components/marketing/PartnersPage.jsx)

  **Page Hero**: Badge pill ("Partner Program" with teal dot), headline "Run your own scaled trading firm. Powered by Hyperscaled infrastructure." (second line in zinc-400), subtext about launching without infrastructure, dual CTAs (mailto:partners@hyperscaled.trade primary, Download Partner Overview secondary with TODO for PDF link).

  **What You Control**: 6 feature cards in 3x2 grid (lg) / 2x3 (sm) / 1-col (mobile). Each card: CheckCircle teal icon + title + description. Items: pricing, profit split, direct payments, white-label branding, permissionless scaling, network-aligned incentives.

  **Revenue Model**: Two cards side by side — Trader Registration Fees (USDC) and Network Rewards (Alpha Emissions). Below: teal-tinted mental model callout box with monospace text (USDC = business revenue + payout liquidity, Alpha = network funding capacity + scaling collateral).

  **How It Works**: 4-step vertical timeline with numbered teal circles and connecting line. Steps: apply → configure → bring traders → scale. Different layout from trader How It Works page (vertical timeline vs horizontal step cards).

  **Division of Responsibility**: Two-column card layout matching Rules page disqualification pattern. Left card (neutral border): operator responsibilities (4 items). Right card (teal-tinted border): Hyperscaled responsibilities (5 items). Both use CheckCircle icons.

  **Funding Capacity Table**: Desktop table with Account Size / Alpha Required columns (3 rows: $25K/7.14, $50K/14.28, $100K/28.5). Mobile stacked cards. Below: "$3,500 in scaled capital per 1 Alpha token."

  **Application CTA**: Centered headline "Ready to launch your firm?", body about 48-hour review + whiteglove onboarding, shiny-cta mailto button.

  **Patterns**: No scroll animations — matches Rules/FAQ documentation tone. &nbsp; for widow prevention. textWrap: 'balance' on hero and CTA. max-w-[900px] content container. No Framer Motion. Uses 'use client' for Phosphor Icons only.

  **TODO added**: Partner Overview one-pager PDF link added to docs/TODO_POLISH.md.

- **Phase 8b — Partners Page Polish**:
  Files changed: 1 (components/marketing/PartnersPage.jsx)

  **Fix 1 — Unique icons**: Replaced uniform CheckCircle on all 6 feature cards with unique per-card Phosphor icons (CurrencyDollar, ChartPie, Wallet, PaintBrush, ArrowsOutSimple, Lightning). Icons rendered in duotone weight inside teal-tinted 32px square containers. Removed dead imports (CoinsVertical, InfinityIcon, ChartLineUp).

  **Fix 2 — Visual rhythm**: Revenue Model and How It Works sections now have full-width tinted backgrounds (bg-white/[0.02] + border-y border-white/[0.06]). Creates alternating content → tinted → content → tinted rhythm. Bottom CTA gets border-t + pt-16 separation.

  **Fix 3 — Visible headings**: Removed sr-only from Responsibility ("Clear division of responsibility.") and Funding Capacity ("Funding capacity by account size") h2 elements. Now matches the label + heading pattern used on every other section site-wide.

  **Fix 4 — Dead CTA removed**: Removed "Download Partner Overview" secondary CTA that linked to href="#". Hero now has single clean "Apply to Become a Partner" button. PDF link tracked in TODO_POLISH.md.

  **Fix 5 — Bold mental model callout**: Callout redesigned from inline monospace text to two-column grid with large (text-lg/xl) bold labels (USDC / Alpha) and descriptive subtext. Increased padding and background opacity. This is now the screenshotable element.

  **Fix 6 — Timeline connector**: Increased from w-px bg-white/[0.06] to w-[2px] bg-teal-400/20 for visibility across displays.

  **Fix 7 — Minor**: Funding note bumped from text-xs text-zinc-500 to text-sm text-zinc-400 font-mono.

- **Copy Review A — Home + Pricing**:
  Files changed: 7 (lib/constants.js, Hero.jsx, Problem.jsx, Solution.jsx, HowItWorks.jsx, Features.jsx, PricingPage.jsx, marketing.jsx)
  Files created: 1 (components/marketing/PricingPreview.jsx)

  **Constants (lib/constants.js)**:
  - HERO_STATS: stat1 → 1-Step/Evaluation, stat2 → 100%/Profit Split, stat3 unchanged
  - NETWORK_STATS: "4,200+ Funded Traders" → "5,500+ Traders"
  - PRICING_TIERS: tier-1/2 scalingPath → "Up to $100K", all payoutCycle → "Monthly", popular moved from tier-2 to tier-3, strikethrough prices verified ($299/$549/$999)

  **Hero (Hero.jsx)**:
  - Added hero stats row back below CTAs (was removed in prior commit), importing from HERO_STATS
  - Stats display: 1-Step Evaluation · 100% Profit Split · $30M+ Rewards Distributed

  **Problem (Problem.jsx)**:
  - Subtext: "Legacy scaled trading" → "Funded trading", "KYC walls, profit extraction" → "KYC barriers, payout denials"
  - Card 1 body: shortened to single sentence about 150+ countries
  - Card 2 body: "extract" → "keep", "No accountability, no transparency —" → "No accountability or transparency,"
  - Card 3 body: "full discretion" → "full, centralized discretion", ending changed to "no guarantee you receive a payout"
  - Callout: "100% performance rewards" → "100% performance of rewards", "network is aligned with trader success" → "decentralized network is aligned with your success. No exceptions."

  **Solution (Solution.jsx)**:
  - Headline: "Permissionless. No middlemen." → "Decentralized. Transparent."
  - Body: "protocol-scaled simulated account" → "scaled account on our network", "onchain, automatically, on a 7-day cycle" → "monthly, automatically, and onchain"
  - Feature 2: "7-day cycle. Fully verifiable." → "every week. Fully transparent."
  - Feature 4: "That's all we need." → "It's that simple."
  - Comparison table KYC: "None" → "No" (also updated hsBest Set)

  **HowItWorks (HowItWorks.jsx)**:
  - Headline: "Get scaled by the network." → "Earn a scaled trading account."
  - Step 01 title: "Start Your Evaluation" → "Start your Challenge"
  - Step 01 body: removed "USDC registration fee", simplified to "Pay a one-time fee. No recurring charges or subscriptions."
  - Step 03 body: restructured around "Hyperscaled Challenge" phrasing

  **Features (Features.jsx)**:
  - Headline: "Built for traders who trade with an edge." → "Built for traders with an edge."
  - Card 1 body: shortened to "Trade, perform, and unlock scaled capital through our one-step challenge."
  - Card 2 body: "scales automatically — no application, no fees" → "will automatically grow with zero fees"
  - Card 3 body: simplified to "Pay your registration fee in USDC, receive payouts in USDC. Direct to your wallet and verifiable onchain."
  - Card 4 body: shortened to "Every payout is tracked onchain. No exceptions."
  - Card 5 body: "Same order book. Same fills. Same execution." → "Use the platform you already know and love."
  - Card 6 body: "clear, fixed, and published" → "clear upfront and open-source"
  - Card 6 extra: removed "Dispute resolution: automated" bullet

  **PricingPreview (new — components/marketing/PricingPreview.jsx)**:
  - 3 condensed horizontal pricing cards with tier label, account name, launch price, strikethrough, CTA
  - Tier III gets "Most Popular" badge with Star icon
  - All CTAs link to https://app.hyperscaled.trade
  - Below cards: "Launch pricing active. Limited-time pricing."
  - Added to marketing.jsx between Features and PartnersCTA

  **PricingPage (PricingPage.jsx)**:
  - Launch banner: green emoji + "Save up to 50% for a limited time." (was "Standard pricing takes effect...")
  - Hero subtext: "Pay a one-time USDC registration fee to take the Hyperscaled challenge. No hidden fees."
  - Removed WhatsIncluded badge row entirely
  - New WhatsIncludedGrid: 6-card compact grid with Phosphor icons (ListChecks, Target, CalendarCheck, Wallet, Lightning, LinkSimple) + title + 1-line desc
  - New ModelSection: "A MODEL BUILT FOR TRADERS" label, left column with bullet list + bold line, right column with EvalProgressWidget mockup (profit target bar, high water mark, drawdown bar, completion %)
  - Most Popular badge now on $100K card (via PRICING_TIERS.popular flag change)

- **Copy Review B — How It Works + Rules + Partners**:
  Files changed: 4 (HowItWorksPage.jsx, RulesPage.jsx, PartnersPage.jsx, lib/constants.js)

  **Constants (lib/constants.js)**:
  - EVAL_RULES: added Consistency Criteria (None) and Weekend Trading (Allowed)
  - FUNDED_RULES: removed redundant Drawdown Limit row (covered by Daily Loss + EOD Trailing)

  **HowItWorksPage (HowItWorksPage.jsx)**:
  - Hero: headline → "Trade on Hyperliquid. Get scaled by the network.", subtext shortened
  - Step 01: title "Register & Choose Your Size", body shortened, added "Get started" CTA link, details: "Challenge: One-Step", "KYC Required: None"
  - Step 02: title removed "(Your Normal Workflow)", body shortened, details simplified
  - Step 03: title "Track in Real Time", body mentions Chrome plugin, details: "Platform: Hyperscaled App & Chrome Plugin", "Updates: Always in real-time", removed Tracked metrics row
  - Step 04: title punctuated "Pass. Get Funded. Get Paid.", body shortened, "Max Drawdown (Funded): 8% daily / 8% EOD trailing", "25% bonus" label
  - Scaling body: removed "no re-evaluation"
  - Non-custodial explainer: removed 3 body paragraphs + label/heading, replaced with callout bar "Your wallet. Your keys..." above comparison boxes
  - Payout mechanics: headline "Automated. Monthly. Onchain.", body rewritten, KYC note shortened
  - Bottom CTA: removed "View Pricing" secondary link
  - Added PricingPreview component between PayoutMechanics and BottomCTA

  **RulesPage (RulesPage.jsx)**:
  - Hero: headline → "Rules and Trading Objectives", subtext shortened
  - Removed redundant h2 headings for Evaluation, Funded, Scaling, Disqualification (kept teal labels as section anchors)
  - Kept h2 headings for KYC and Protocol sections
  - Removed ScalingPathVisual from scaling section (From/To table sufficient)
  - Removed unused ScalingPathVisual import

  **PartnersPage (PartnersPage.jsx)**:
  - Removed badge pill from hero
  - Body: combined "You bring traders. You set your pricing. You collect revenue." into single sentence
  - Feature 6: "network rewards your firm with Alpha emissions" → "underlying network directly rewards your firm"
  - Revenue stream 2: "Hyperscaled network emits Alpha tokens to your firm's miner" → "Hyperscaled's decentralized funding engine emits Alpha tokens to your firm"
  - How It Works step 1: removed "miner deployment" from onboarding list
  - How It Works step 4: "More traders. More revenue." → "More traders = more revenue."
  - Responsibility headline: "Clear division of responsibility." → "Designed for your success."
  - Hyperscaled handles bullet 4: "Miner deployment and network coordination" → "Infrastructure coordination and deployment"
  - Application CTA body: shortened to "full whiteglove onboarding with support from the Hyperscaled team"
  - Added 4 trust signals below CTA button (CheckCircle icons)

  3.8 polish items already completed in Phase 8b — verified: unique icons, no dead CTA, visible headings, strong callout, tinted sections, timeline connector, note styling.

- **Updates A — Global Eval→Challenge Rename + Nav Restructure**:
  Files changed: 22 (lib/constants.js, Nav.jsx, Hero.jsx, Features.jsx, Footer.jsx, Solution.jsx, PricingPage.jsx, RulesPage.jsx, HowItWorksPage.jsx, FAQPage.jsx, TraderDashboard.jsx, AgentsPage.jsx, PartnersPage.jsx, PartnersCTA.jsx, step-confirmation.jsx, step-connect-pay.jsx, step-select-tier.jsx, app/register/page.jsx, app/(marketing)/pricing/page.jsx, app/(marketing)/rules/page.jsx, app/(marketing)/faq/page.jsx, app/(marketing)/partners/page.jsx)

  **Global Rename — "Evaluation" → "Challenge" (50+ replacements)**:
  - HERO_STATS label: Evaluation → Challenge
  - EVAL_RULES: Evaluation Phases → Challenge Phases
  - FUNDED_RULES: re-enter the evaluation → re-enter the challenge
  - PRICING_TIERS: Start $25K/$50K/$100K Evaluation → Challenge
  - FAQ_ITEMS category: The Evaluation → The Challenge
  - FAQ_ITEMS: 10 answer strings updated (pass the evaluation → challenge, enter the evaluation → challenge, evaluation dashboard → challenge dashboard, etc.)
  - FAQ IDs: how-evaluation-works → how-challenge-works, retry-evaluation → retry-challenge
  - PRICING_FAQ: 2 strings updated
  - HOME_FAQ_IDS / PRICING_FAQ_IDS: ID references updated
  - Hero.jsx: Start Your Evaluation → Start Your Challenge
  - Nav.jsx: Start Evaluation → Start Challenge
  - Footer.jsx: Evaluation Rules → Challenge Rules
  - Features.jsx: One-Step Evaluation → One-Step Challenge, Evaluation Phases → Challenge Phases, evaluation rules → challenge rules
  - Solution.jsx: Evaluation → Challenge (comparison row)
  - PricingPage.jsx: 6 instances (hero, included features, progress widget, model section)
  - RulesPage.jsx: 12 instances (TOC, section ID, labels, body copy, disqualification text, KYC, CTA)
  - HowItWorksPage.jsx: 2 instances (hero CTA, max drawdown label)
  - FAQPage.jsx: hero subtext
  - TraderDashboard.jsx: 3 instances (badge, section header)
  - AgentsPage.jsx: 1 instance (pre-submission validation body)
  - PartnersPage.jsx: 2 instances (responsibility, hero body)
  - PartnersCTA.jsx: 1 instance
  - step-confirmation.jsx: Evaluation starts now → Challenge starts now
  - step-connect-pay.jsx: 2 instances (fee label, pay button aria-label)
  - step-select-tier.jsx: 2 instances (promo banner, subtext)
  - Page metadata: 5 files updated (register, pricing, rules, faq, partners)
  - Comment: constants.js section comment updated (Evaluation & Funded → Challenge & Funded)

  **Intentionally left unchanged**:
  - Code variable names (EVAL_RULES, EvalRulesSection, EvalProgressWidget, etc.) — const names kept for code stability per instructions
  - Component file names (no renames)
  - The word "evaluates" in FAQ answer for 'what-is-hyperscaled' — this is a verb describing what the system does ("Hyperscaled evaluates your performance"), not a branded process name

  **Nav Restructure**:
  - Links reordered to: How It Works · Pricing · For Agents · Rules · Leaderboard · Partners · FAQ
  - For Agents link added → /agents (existing page)
  - Progressive responsive collapse:
    - xl+ (>1280px): all 7 links, no hamburger
    - lg–xl (1024–1280px): How It Works, Pricing, For Agents, Rules visible; Leaderboard, Partners, FAQ in hamburger
    - md–lg (768–1024px): How It Works, Pricing, For Agents visible; rest in hamburger
    - <md (<768px): all links in hamburger only
  - Hamburger always contains ALL 7 links regardless of which are visible in desktop nav
  - Search input removed (was already backlogged in TODO_POLISH.md — interfered with progressive collapse layout)
  - Old left/right link split removed — single NAV_LINKS array with per-link visibility classes
  - Removed unused imports (useRouter, MagnifyingGlass)

  **Build note**: Pre-existing build failure from missing backend deps (google-cloud/cloud-sql-connector, google-auth-library) in lib/db/index.js — not from our changes.

- **Updates B — Homepage Reorder + Page-Specific Fixes**:
  Files changed: 5 (marketing.jsx, Problem.jsx, HowItWorksPage.jsx, PartnersPage.jsx, lib/constants.js)
  Files created: 1 (components/marketing/HomePricing.jsx)

  **Homepage Section Reorder (marketing.jsx)**:
  - New order: Hero → HowItWorks → HomePricing → Features → Solution → Problem → PartnersCTA → FAQ
  - Removed: Stats import and component (Network Stats Bar was standalone section; key stats already in hero row)
  - Removed: PricingPreview import (replaced by HomePricing)

  **HomePricing (new — components/marketing/HomePricing.jsx)**:
  - Full detailed pricing cards matching /pricing page — not the compact PricingPreview widget
  - Section label "PRICING", headline "Choose your account size."
  - 3 cards with all 7 spec rows (Account Size, Profit Target, Max Drawdown, Profit Split, Payout Cycle, Scaling Path, Time Limit)
  - Most Popular badge on $100K / Tier III
  - Tier-specific CTAs linking to https://app.hyperscaled.trade
  - "Launch pricing active. Limited-time pricing." note below cards

  **Copy Fixes**:
  - NETWORK_STATS label: "Rewards Distributed" → "Network Rewards Distributed"
  - Problem card 2 body: "No accountability or transparency" → "With no accountability or transparency"
  - Problem callout bar: "pays 100% performance of rewards" → "pays out 100% of rewards to traders"

  **How It Works Page (HowItWorksPage.jsx)**:
  - Removed "Minimum Trading Capital: $1,000 in Hyperliquid" row from Step 02 key details
  - Tightened teal callout bar spacing: mb-10 → mb-6 (sits closer to comparison boxes)

  **Partners Page (PartnersPage.jsx)**:
  - Removed entire FundingCapacitySection: teal label, heading, body text, desktop table, mobile cards, footnote
  - Removed FUNDING_TABLE data constant
  - Clean removal — no leftover spacing

  **FAQ Updates (lib/constants.js)**:
  - Added to "Technical & Platform" category: "What pairs are available to trade?" with answer listing 13 crypto perpetuals
  - Removed "minimum-capital" question from "Getting Started" category (was not in HOME_FAQ_IDS so no homepage impact)

  **Build note**: Same pre-existing build failure from missing backend deps — not from our changes.

## In progress

Nothing currently in progress.

## Next action

Polish pass next.

## Known issues

- x402 payment flow requires a server-side 402 endpoint — using direct USDC transfer via wagmi/viem as fallback until API is confirmed
- No loading/skeleton states on dashboard widgets (spinners may exist — need to swap to skeletons)
- Responsive behavior untested across all pages
- Dark mode is hard-coded (CSS variables set to dark only) — light mode decision pending
- Two icon libraries in use (Phosphor + Lucide) — need to standardize on Phosphor for new work
- Pre-existing build error: apple-icon.png and favicon.ico cause PageNotFoundError during `next build` (not from our changes)

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
