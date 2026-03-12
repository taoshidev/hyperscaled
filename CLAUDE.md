# Hyperscaled

Read this file at the start of every session before writing any code.

## What This Is

Hyperscaled is a decentralized prop trading network built on Hyperliquid. This repo is the frontend — marketing site, trader dashboard, leaderboard, miner detail pages, and registration flow. All data is currently mock/fake. The focus is UI/UX quality, not backend integration.

## Repo Map

```
app/                          ← Next.js 15 App Router pages + API stubs
  api/                        ← Mock API routes (dashboard, register, status)
  dashboard/                  ← Trader dashboard (protected, uses Providers)
  leaderboard/                ← Network leaderboard
  miner/[slug]/               ← Individual miner detail (dynamic route)
  status/                     ← Network status page
components/
  dashboard/                  ← Dashboard widgets (positions, orders, PnL, stats)
  marketing/                  ← Landing page sections (Hero, Features, FAQ, etc.)
  registration/               ← Multi-step registration flow
  status/                     ← Status checker
  ui/                         ← Shared primitives (button, card, dialog, input)
hooks/                        ← Data hooks (use-dashboard, use-dashboard-stream)
lib/                          ← Utilities, constants, formatting, wagmi config
public/                       ← Logos, miner avatars
```

## Tech Stack

- **Framework**: Next.js 15.3 (App Router, JSX — no TypeScript)
- **React**: 19
- **Styling**: Tailwind CSS v4 (CSS-based config in globals.css, no tailwind.config)
- **Components**: shadcn/ui (Radix + CVA), custom components
- **Web3**: RainbowKit + wagmi + viem (wallet connection)
- **Icons**: Phosphor Icons (primary), Lucide (shadcn default)
- **Animations**: Framer Motion
- **Data**: TanStack React Query + SSE streaming hook
- **Font**: Satoshi (Fontshare)

## Session Start Protocol

1. Read CLAUDE.md (this file)
2. Read docs/ARCHITECTURE.md
3. Read docs/BUILD_STATE.md
4. Read .claude/design-rules.md
5. If working on a specific module, read that module's phase-notes
6. Confirm pwd and worktree are clean
7. Then proceed

For detailed context:
- System design: docs/ARCHITECTURE.md
- Current status: docs/BUILD_STATE.md
- Visual rules: .claude/design-rules.md
- Past decisions: docs/decisions/

## Prompt Format (strict)

Every session prompt must follow:

1. "Read CLAUDE.md before starting"
2. Overview of what this phase does
3. Numbered steps
4. On Completion (update BUILD_STATE.md and phase-notes)
5. Final checks
6. Commit message format: `phase(scope): description`

## Workflow

- **Planning**: Claude chat (this project)
- **Execution**: Claude Code (one phase per session)
- One phase at a time, commit after each phase, push to GitHub
- New Claude Code session for each phase
- Check worktree before every session

## On Completion (every session)

1. Update .claude/phase-notes.md
2. Update docs/BUILD_STATE.md
3. Commit and push

## Hard Rules

1. **No TypeScript** — this project is JSX. Do not convert files or add .ts/.tsx extensions.
2. **Tailwind v4 only** — styles live in globals.css with @theme and CSS variables. No tailwind.config.js.
3. **Animate only transform + opacity** — no layout-triggering animations (width, height, top, left).
4. **min-h-[100dvh] not h-screen** — never use h-screen anywhere.
5. **Skeleton loaders not spinners** — use the .skeleton class from globals.css.
6. **No placeholder names or round numbers** — fake data must look real.
7. **Decision-oriented copy** — labels describe outcomes, not features.
8. **Phosphor Icons for new work** — Lucide only where shadcn components already use it.
9. **No hardcoded secrets** — API keys, wallet addresses, etc. go in .env.
10. **Don't touch API routes** — mock API routes are stable. UI work only unless explicitly told otherwise.
