# Error Reporting Module — Spec

## Context

Hyperscaled has no error reporting infrastructure. Errors are caught in API route try/catch blocks and React Query hooks but only logged to console. There's no visibility into production errors, no Slack alerts for critical failures, and no React Error Boundaries for unhandled client crashes.

This module adds:
- **Slack webhooks** for critical server-side errors (payment failures, gateway down)
- **Sentry** for both client and server error tracking (day one, not deferred)
- **Data sanitization** so sensitive fields never leave the server

---

## Reporting Strategy

| Environment | Channel | What gets reported |
|-------------|---------|-------------------|
| Server — critical | Slack + Sentry | Payment failures, gateway unreachable, DB errors |
| Server — error/warning | Sentry only | KYC errors, validation failures, degraded services |
| Client — unhandled | Sentry | React crashes caught by error boundary |
| Client — handled | Sentry | React Query failures, SSE disconnects |

Slack is reserved for things that need immediate human attention. Sentry captures everything for debugging.

---

## Data Sanitization

### Sensitive data identified in codebase

| Data | Where it flows | Risk |
|------|---------------|------|
| `DATABASE_URL` | `lib/db/index.js` — could appear in DB error stack traces | Critical |
| `SUMSUB_SECRET_KEY`, `SUMSUB_APP_TOKEN` | `lib/sumsub.js` — could appear in API error responses | Critical |
| `RESEND_API_KEY` | `app/api/register/route.js` — email sending | Critical |
| `VALIDATOR_API_KEY` | `app/api/registration-status/route.js` — Bearer token | Critical |
| Email addresses | `users.email` in DB, passed to SumSub and Resend | High |
| `kycApplicantId` | DB + SumSub webhook responses | High |
| KYC `reviewResult` | SumSub webhook — rejection reasons, personal data | High |
| x402 `verifyResult` / `settleResult` | `app/api/register/route.js` — full JSON logged today | High |
| Wallet addresses (`hl_address`, `wallet`) | Throughout API routes and hooks | Medium (public on-chain but trackable) |
| Miner API error text (`errText`) | `app/api/register/route.js` — could echo back user data | Medium |

### `lib/errors-sanitize.js` — Sanitization module

Exports: `sanitize(data)` — recursively processes objects before they're sent to Slack or Sentry.

Rules:
1. **Strip known secret keys** — blocklist of field names: `password`, `secret`, `token`, `apiKey`, `authorization`, `cookie`, `credential`, `databaseUrl`, `connectionString`
2. **Mask wallet addresses** — `0x1a2b3c...7d8e9f` (first 6 + last 6 chars)
3. **Mask emails** — `m***@example.com` (first char + masked + domain)
4. **Truncate long strings** — cap at 500 chars (prevents full API response bodies from leaking)
5. **Scrub stack traces** — remove lines containing env var patterns (`process.env`, connection strings)
6. **Never send**: full request/response bodies, raw DB error messages with query text, SumSub webhook payloads

What IS safe to send:
- Error name and sanitized message
- HTTP status codes
- Error category (e.g., `"payment_failed"`, `"gateway_unreachable"`)
- Masked wallet address
- Request method + path (no query params)
- Timestamps
- Source identifier

---

## New Files

### 1. `lib/errors.js` — Central module (client + server)

Exports:
- `SEVERITY` — `{ CRITICAL: "critical", ERROR: "error", WARNING: "warning" }`
- `reportError(error, context)` — main entry point
- `reportCritical(error, context)` — convenience wrapper
- `reportWarning(message, context)` — convenience wrapper

Context shape:
```js
{
  source: "api/register" | "dashboard-hook" | "sse-stream" | ...,
  severity: "critical" | "error" | "warning",  // defaults to "error"
  userId: "0x...",       // optional, wallet address (will be masked)
  metadata: { ... },    // optional, arbitrary key-value pairs (will be sanitized)
}
```

Behavior:
1. **Sanitize** — runs context through `sanitize()` before sending anywhere
2. **Console** — always logs locally (`console.error` / `console.warn`)
3. **Sentry** — sends to Sentry on both client and server (all severities)
4. **Slack** — server-side only, critical severity only, via dynamic `import("./errors-slack.js")`

Dynamic `import()` keeps Slack code out of client bundles. Sentry uses `@sentry/nextjs` which handles client/server split automatically.

### 2. `lib/errors-slack.js` — Server-only Slack webhook

Single export: `sendSlackAlert({ error, severity, source, timestamp, userId, metadata })`

- Reads `SLACK_ERROR_WEBHOOK_URL` from env — no-op if unset
- Posts Slack Block Kit message with sanitized data only:
  - Red alert emoji + bold severity title
  - Sanitized error message (no raw stack traces)
  - Source, timestamp, masked userId
  - Error category / HTTP status
- 5s timeout via AbortController
- Wrapped in try/catch that swallows — reporting failures never break the app

### 3. `lib/errors-sanitize.js` — Data sanitization

Single export: `sanitize(data)`

- Recursively walks objects
- Applies the blocklist, masking, and truncation rules described above
- Used by both `errors.js` and `errors-slack.js` before any data leaves the process
- Pure function, no side effects

### 4. `sentry.client.config.js` — Sentry client config

- Imports `@sentry/nextjs`
- DSN from `NEXT_PUBLIC_SENTRY_DSN` env var
- `beforeSend` hook calls `sanitize()` on event data
- Reasonable defaults: `tracesSampleRate: 0.1`, `replaysSessionSampleRate: 0` (no session replay)
- Filters out known noise: ResizeObserver errors, browser extension errors

### 5. `sentry.server.config.js` — Sentry server config

- DSN from `SENTRY_DSN` env var
- `beforeSend` hook calls `sanitize()` on event data
- `tracesSampleRate: 0.1`

### 6. `app/error.jsx` — Root error boundary

- `"use client"` component
- Calls `reportError(error, { source: "error-boundary", severity: "critical" })` in `useEffect`
- Renders dark-themed error UI matching design system
- "Try again" button calls Next.js `reset()`

### 7. `next.config.mjs` update — Sentry webpack plugin

`@sentry/nextjs` requires wrapping the Next.js config with `withSentryConfig()`. Source maps uploaded to Sentry for readable stack traces.

---

## Modifications to Existing Files

### 8. `app/providers.jsx` — React Query global error handlers

Add `defaultOptions` to QueryClient with `onError` callbacks that call `reportError`.

### 9. API route catch blocks — add reportError calls

Add `reportError()` before existing return statements. Does NOT change return values or API behavior. Replaces existing `console.error`/`console.warn` calls.

| Route | Severity | Rationale |
|-------|----------|-----------|
| `app/api/register/route.js` | critical | Payment flow — money involved |
| `app/api/dashboard/route.js` | critical | Main user experience |
| `app/api/dashboard/stream/route.js` | error | SSE stream failure |
| `app/api/status/route.js` | error | Status page |
| `app/api/leaderboard/route.js` | error | Leaderboard data |
| `app/api/kyc/token/route.js` | error | KYC flow |
| `app/api/kyc/status/route.js` | error | KYC flow |
| `app/api/kyc/webhook/route.js` | error | KYC webhook processing |
| `app/api/registration-status/route.js` | error | Registration status |

**Important for register route**: The existing `console.log` calls that dump full `JSON.stringify(verifyResult)` and `JSON.stringify(settleResult)` should be replaced with sanitized `reportError` calls — these are the highest-risk leakage points today.

### 10. `hooks/use-dashboard-stream.js` — SSE disconnect warning

Add `reportError` in `es.onerror` handler (severity: warning).

### 11. `.env.example` — add new env vars

---

## Environment Variables

| Variable | Side | Required | Description |
|----------|------|----------|-------------|
| `SLACK_ERROR_WEBHOOK_URL` | Server | No | Slack webhook. If unset, Slack alerts are skipped. |
| `NEXT_PUBLIC_SENTRY_DSN` | Client + Server | No | Sentry DSN. If unset, Sentry is skipped. |
| `SENTRY_DSN` | Server | No | Server-side Sentry DSN (can be same value). |
| `SENTRY_AUTH_TOKEN` | Build | No | For source map uploads. |

---

## New Dependency

`@sentry/nextjs` — the only new package. Handles client/server split, source maps, Next.js integration automatically.

---

## Implementation Order

1. `npm install @sentry/nextjs`
2. `lib/errors-sanitize.js` — standalone, no deps
3. `lib/errors-slack.js` — depends on sanitize
4. `lib/errors.js` — depends on sanitize + slack
5. `sentry.client.config.js` + `sentry.server.config.js`
6. `next.config.mjs` — wrap with `withSentryConfig`
7. `app/error.jsx` — root error boundary
8. `app/providers.jsx` — React Query global handlers
9. API routes — register first, then dashboard, then rest
10. `hooks/use-dashboard-stream.js`
11. `.env.example`
12. Update `docs/BUILD_STATE.md` + `.claude/phase-notes.md`

---

## Verification

1. `npm run build` — no build errors, Slack module not in client bundle
2. Dev server — trigger API error, confirm sanitized console output
3. Set `SLACK_ERROR_WEBHOOK_URL`, trigger critical error — confirm Slack message with no sensitive data
4. Set `NEXT_PUBLIC_SENTRY_DSN`, trigger client error — confirm event appears in Sentry dashboard
5. Grep Sentry events for blocklisted field names — confirm none present
6. Trigger error boundary — confirm `app/error.jsx` renders and reports to Sentry

---

## What This Does NOT Include (intentionally)

- No per-route `error.jsx` files — root boundary is sufficient for now
- No `global-error.jsx` — only needed if `layout.jsx` itself can crash
- No rate limiting on Slack webhook — premature for current scale
- No Sentry session replay — privacy concern, can enable later if needed
- No client-side Slack posting — all webhook calls are server-side only
