# Hyperscaled — Phase Notes

## Current status

Registration Phase 1 complete. Tier selection UI is live at /register with interactive cards, stepper, and marketing CTAs updated.

## Completed phases

- **Phase 0**: Initial build — marketing site, dashboard, leaderboard, miner detail, status page, registration flow, mock API routes, wallet connection
- **Registration Phase 1**: Route, stepper, tier selection UI — /register route with Providers layout, 4-step stepper (Phosphor Icons + Framer Motion), interactive tier cards (Starter $25K, Pro $50K, Elite $100K), TIERS data in lib/constants.js, marketing CTAs updated to link to /register, email step removed from flow

## In progress

Nothing currently in progress.

## Next action

Registration Phase 2: Wallet connection step (HL address input) + USDC payment step + confirmation step

## Known issues

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
- TIERS array is single source of truth in lib/constants.js (not lib/miners.js)
- Hero CTA changed from WaitlistForm email capture to direct /register link
- Nav CTA changed from "Extension" to "Start Evaluation" linking to /register
