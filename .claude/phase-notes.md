# Hyperscaled — Phase Notes

## Current status

Registration Phase 2 complete. Full flow from tier selection → wallet input → payment screen is wired and functional.

## Completed phases

- **Phase 0**: Initial build — marketing site, dashboard, leaderboard, miner detail, status page, registration flow, mock API routes, wallet connection
- **Registration Phase 1**: Route, stepper, tier selection UI — /register route with Providers layout, 4-step stepper (Phosphor Icons + Framer Motion), interactive tier cards (Starter $25K, Pro $50K, Elite $100K), TIERS data in lib/constants.js, marketing CTAs updated to link to /register, email step removed from flow
- **Registration Phase 1 Harden**: Accessibility + performance fixes — ARIA radiogroup with roving tabindex on tier cards, semantic stepper (ol/li + aria-current), ins/del + sr-only for pricing, focus-visible indicators, main landmark, 44px touch target on Continue, targeted transitions (no transition-all), brightened small muted text (oklch 0.65), text-xs (12px) floor on all labels, removed Framer Motion from card selected indicator
- **Registration Phase 2**: Tier polish + wallet input + payment wiring
  - **Part A — Tier Data Fix + Card Polish**: Corrected TIERS details to label/value objects (5% drawdown, Unlimited trading period, Account Scaling varies per tier). Replaced checklist-style detail rendering with label/value rows (flex justify-between, font-mono values). Added separator between pricing and details. Elevated Pro card with md:scale-[1.02] md:z-10 and brighter border (border-white/[0.15]).
  - **Part B — Wallet Address Input**: Rebuilt step-hl-address.jsx — centered max-w-lg layout, auto-focus input, font-mono text-lg input with p-4 padding, blur validation (regex /^0x[a-fA-F0-9]{40}$/), inline error with role="alert" and aria-describedby, selected tier summary card above input, Continue button (h-11) + Back text button (h-11), fadeInUp animation.
  - **Part C — USDC Payment**: Rebuilt step-payment.jsx — order summary card (tier name, account size, HL wallet truncated, pricing with del/ins, total line font-mono), RainbowKit ConnectButton when not connected, chain switching for Base, USDC balance check, payment states (idle/processing/success/error), skeleton shimmer on processing, CheckCircle (Phosphor fill) on success with 1.5s auto-advance, destructive error display with try-again button, back button hidden during processing. Uses direct wagmi/viem USDC transfer as fallback (x402 requires 402 endpoint not yet wired — TODO comment in place). Added NEXT_PUBLIC_VANTA_USDC_WALLET to .env.example.

## In progress

Nothing currently in progress.

## Next action

Registration Phase 3: Confirmation step UI

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
- Registration flow is now 4 steps: Select Plan → Wallet → Payment → Confirmation (email step removed)
- TIERS array is single source of truth in lib/constants.js (not lib/miners.js) — uses label/value objects for details
- Hero CTA changed from WaitlistForm email capture to direct /register link
- Nav CTA changed from "Extension" to "Start Evaluation" linking to /register
- Payment uses direct USDC transfer (wagmi/viem) as fallback; x402 integration deferred until 402 endpoint exists
- VANTA_USDC_WALLET exposed as NEXT_PUBLIC env var with zero-address default
