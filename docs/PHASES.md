# Launch Phases

Last updated: 2026-03-19

## Phase Map

| Phase | Scope | Status | Depends On |
|-------|-------|--------|------------|
| 0 | Global Compliance + Design Rule Sweep | Done | — |
| 1 | Nav + Footer Overhaul | Done | Phase 0 |
| 2 | Shared Constants + Components | Done | Phase 0 |
| 3 | Home Page Overhaul (`/`) | Done | Phase 1, 2 |
| 4 | Pricing Page (`/pricing`) | Done | Phase 1, 2 |
| 5 | How It Works Page (`/how-it-works`) | Done | Phase 1, 2 |
| 6 | Rules Page (`/rules`) | Done | Phase 1, 2 |
| 7 | FAQ Page (`/faq`) | Done | Phase 1, 2 |
| 8 | Partners Page (`/partners`) | Done | Phase 1, 2 |

## Workflow Rules

1. One phase per Claude Code session
2. Read CLAUDE.md at session start
3. Update PHASES.md status column on completion
4. Update BUILD_STATE.md on completion
5. Commit format: `phase{N}(scope): description`
6. Push after each phase
7. Return to planning chat between phases for next prompt

## Open Decisions

| # | Question | Status | Answer |
|---|----------|--------|--------|
| 1 | Nav search — navigates to /leaderboard?addr=? | Open | — |
| 2 | Chrome Extension CTA on registration confirmation | Open | — |
| 3 | Social link URLs (Twitter, Discord, GitHub) | Resolved | Phase 4: x.com/hyperscaledhq, discord.gg/hyperscaledhq, github.com/taoshidev |
| 4 | Docs link URL in footer | Resolved | Phase 4: docs.taoshi.io |
| 5 | Legal pages — exist or placeholder? | Resolved | Placeholder pages exist (/terms, /privacy, /risk) |
| 6 | Partner application — form or mailto? | Resolved | mailto: partners@hyperscaled.trade |
