# Architecture

## Overview

Hyperscaled frontend is a Next.js 15 App Router application. Pages are server components by default; interactive sections wrap in client components. Web3 wallet connection (RainbowKit/wagmi) is provided via a `<Providers>` wrapper applied per-layout to routes that need it (dashboard, miner, status — but not marketing).

```
Browser
  └─ Next.js App Router
       ├─ / ........................ Marketing (static, no Providers)
       ├─ /dashboard .............. Trader dashboard (Providers + streaming)
       ├─ /leaderboard ............ Rankings (Providers)
       ├─ /miner/[slug] ........... Miner detail (Providers, dynamic route)
       ├─ /status ................. Network status (Providers)
       └─ /api/* .................. Mock API routes (stub data, SSE stream)
```

## Page Architecture

### Marketing (`/`)

- Single file orchestrator: `components/marketing.jsx` composes all sections
- Sections are individual components: Hero, Features, HowItWorks, Problem, Solution, Stats, FAQ, Footer
- `LiquidCrystalBg` — animated background effect
- `ShinyButton` — CTA with CSS gradient animation
- `WaitlistForm` — email capture
- No wallet connection, no Providers wrapper

### Dashboard (`/dashboard`)

- Entry: `components/dashboard/dashboard.jsx` orchestrates all panels
- Widgets: account-overview, stats-panel, open-positions, pending-orders, trade-history, order-events, connection-status
- Data: `hooks/use-dashboard.js` (REST polling via React Query) + `hooks/use-dashboard-stream.js` (SSE for real-time events)
- Mock APIs: `/api/dashboard` (snapshot), `/api/dashboard/events` (history), `/api/dashboard/stream` (SSE)

### Registration

- Multi-step flow: `components/registration/registration-flow.jsx`
- Steps: select-tier → connect-and-pay → confirmation (3 steps)
- Payment uses wagmi/viem for USDC transfer (ABI in `lib/usdc-abi.js`)

### Leaderboard (`/leaderboard`)

- Static page with mock miner data from `lib/miners.js`
- Links to `/miner/[slug]` detail pages

### Status (`/status`)

- `components/status/status-checker.jsx`
- Calls `/api/status` for network health data

## Data Flow (current — all mock)

```
Mock API routes (/api/*)
  ↓ JSON responses + SSE stream
React Query (hooks/use-dashboard.js)
  ↓ cached, refetched on interval
Dashboard components
  ↓ render with real-looking fake data
```

When backend integration happens, the swap is: replace API route internals, hooks stay the same.

## External Dependencies

- **Fontshare** — Satoshi font (CDN loaded in root layout `<head>`)
- **RainbowKit/wagmi** — wallet connection + chain config (in `lib/wagmi.js`)
- **x402** — payment protocol for registration flow

## Key Files

| File | Purpose |
|------|---------|
| `app/providers.jsx` | RainbowKit + wagmi + React Query provider stack |
| `lib/wagmi.js` | Chain and wallet configuration |
| `lib/constants.js` | Network constants, addresses |
| `lib/format.js` | Number/currency/date formatting |
| `lib/miners.js` | Mock miner data for leaderboard |
| `lib/gateway.js` | API gateway utility |
| `lib/validation.js` | Form validation |

## Known Constraints

- **No TypeScript** — entire project is JSX. Don't introduce .ts files.
- **Tailwind v4** — no tailwind.config file. All theme config in globals.css `@theme inline` blocks.
- **Mock data only** — API routes return fake data. Don't build real integrations yet.
- **Providers are per-layout** — marketing page intentionally has no wallet/query providers.
