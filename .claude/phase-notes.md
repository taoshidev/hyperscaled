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

## In progress

Nothing currently in progress.

## Next action

Phase 1 — Nav + Footer Overhaul (see docs/PHASES.md).

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
