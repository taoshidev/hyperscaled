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

## In progress

Nothing currently in progress.

## Next action

UI polish pass across all pages.

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
