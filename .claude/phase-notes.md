# Hyperscaled — Phase Notes

## Current status

Phase 0 (scaffold) complete. All pages have first-pass implementations. Project structure docs being added now.

## Completed phases

- **Phase 0**: Initial build — marketing site, dashboard, leaderboard, miner detail, status page, registration flow, mock API routes, wallet connection

## In progress

Project structure setup — adding CLAUDE.md, design-rules, architecture docs, build state tracking

## Next action

Phase 1: UI polish pass on the dashboard — loading states, empty states, responsive behavior, data formatting consistency

## Known issues

- No loading/skeleton states on dashboard widgets (spinners may exist — need to swap to skeletons)
- Responsive behavior untested across all pages
- Dark mode is hard-coded (CSS variables set to dark only) — light mode decision pending
- Two icon libraries in use (Phosphor + Lucide) — need to standardize on Phosphor for new work

## Decisions made

- Tailwind v4 CSS-based config (no tailwind.config.js)
- Satoshi as primary typeface
- Teal (#00C6A7) as brand accent
- Mock data throughout — no backend integration yet
- Providers wrapper applied per-layout, not in root layout (marketing stays static)
