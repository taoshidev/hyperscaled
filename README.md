# Hyperscaled

The Next.js 15 frontend, miner-facing API, and registration backend for the
[Hyperscaled](https://hyperscaled.trade) decentralized prop-trading network on
Hyperliquid (powered by the Vanta Network).

This repo serves three audiences:

- **Traders** — marketing site, leaderboard, registration flow, dashboard.
- **Entity miners** — read-only `/api/entity` plus the per-miner status feeds.
- **SDK / extension consumers** — public REST surface under `app/api/*` that
  the Python SDK ([`hyperscaled-sdk`](https://github.com/taoshidev/hyperscaled-sdk))
  and the Chrome extension ([`hyperscaled_extension`](https://github.com/taoshidev/hyperscaled_extension))
  call to discover miners, register accounts, check status, and stream
  dashboard data.

The **only** server surface is `app/api/*`. The UI, the SDK, and the extension
all read through these routes — none of them should hit the validator or a
miner gateway directly.

## Tech stack

- **Framework:** Next.js 15.5 (App Router, **JSX — no TypeScript**), React 19
- **Styling:** Tailwind CSS v4 (CSS-only config in `app/globals.css`)
- **Components:** shadcn/ui (Radix + CVA), Phosphor Icons
- **Web3:** RainbowKit + wagmi + viem; Polkadot util-crypto for SS58 signatures
- **Payments:** `@coinbase/x402` + `@x402/evm` (Base USDC) and Hyperliquid
  ledger transfers
- **Data layer:** Drizzle ORM + `pg`, optional `@google-cloud/cloud-sql-connector`
- **KYC:** Sumsub websdk + server-side webhook (HMAC verified)
- **Affiliates:** Tolt server-side conversion API
- **Observability:** Sentry (browser + server + edge), Slack alert webhook
- **Email:** Nodemailer

## Prerequisites

- Node ≥ 20 (`node -v` to check)
- pnpm 10+ (`npm install -g pnpm`). The repo declares
  `packageManager: "pnpm@10.x"` and ships an `.npmrc` tuned for the
  Web3/wallet dependency tree.
- Postgres 14+ reachable at the URL in `DATABASE_URL` (local Homebrew
  `postgresql@16` matches the `vanta-ui` setup).

## Local dev (TL;DR)

```bash
# 1. Configure environment
cp env.example .env.local
# Fill in at least DATABASE_URL, VALIDATOR_API_URL, VALIDATOR_API_KEY,
# HYPERSCALED_USDC_WALLET — see Environment section.

# 2. Install
pnpm install

# 3. Create the database (one-time)
createdb hyperscaled

# 4. Apply schema + seed miners + tiers
pnpm db:push
pnpm db:seed

# 5. Run dev server (always on :4568)
pnpm dev
# → http://localhost:4568
```

Smoke test:

```bash
curl http://localhost:4568/api/entity | jq '.[].slug'
# → "vanta", "jolly", "bitcast", "talisman", "zoku"
```

## Environment

`env.example` is the canonical list of variables. The table below covers the
non-obvious ones — read `env.example` for the rest.

| Var                                                           | Required     | Purpose                                                                                                                   |
| ------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                | yes          | Postgres connection string. Local default `postgresql://localhost:5432/hyperscaled`.                                      |
| `VALIDATOR_API_URL`                                           | yes          | Vanta validator base URL. Dev: `https://validator.testnet.vantatrading.io`. Prod: `https://validator.mainnet.vantatrading.io`. |
| `VALIDATOR_API_KEY`                                           | yes          | Server-side bearer for privileged validator paths (stats, ledger, payouts). Never exposed to the client.                  |
| `HYPERSCALED_BASE_URL`                                        | yes          | Public origin of this app. Dev: `http://localhost:4568`.                                                                  |
| `DEFAULT_MINER_SLUG`                                          | yes          | Slug used when registration UX falls back to "no miner picked yet" — currently `vanta`.                                   |
| `USE_TESTNET`                                                 | yes          | `true` toggles Hyperliquid testnet endpoints / chain IDs across the app.                                                  |
| `HYPERSCALED_USDC_WALLET`                                     | yes (seed)   | Receiving wallet for USDC registration payments. Read only by `lib/db/seed.mjs` and written into `entity_miners.usdc_wallet` for the Vanta row. The UI fetches the wallet at runtime from `/api/miners/<slug>` — this value is never bundled to the client. |
| `NEXT_PUBLIC_HYPERSCALED_BUILDER_ADDRESS`                     | no           | Hyperliquid builder code address. When unset, `approveBuilderFee` is skipped.                                             |
| `DEV_TEST_WALLETS`                                            | no           | Comma-separated allowlist of EVM addresses that pay $0.01 instead of full price. **Never set in production.**             |
| `SKIP_ENTITY_MINER_CALL`                                      | no           | Skips the post-registration call to the miner gateway's `create-hl-subaccount`. Useful when running without a real miner. |
| `STUB_GATEWAY`                                                | no           | Returns deterministic stub data from `lib/gateway-stubs.js` for offline UI dev.                                           |
| `CRON_SECRET`                                                 | yes (prod)   | Bearer secret for `GET /api/sync-registrations` (Vercel cron).                                                            |
| `RETRY_SECRET`                                                | yes (prod)   | Bearer secret for `POST /api/register/retry`.                                                                             |
| `VANTA_SYNC_API_KEY`                                          | yes (prod)   | Bearer secret for `POST /api/vanta-sync`.                                                                                 |
| `PREFLIGHT_SECRET` + `ENABLE_PREFLIGHT_AUTH`                  | optional     | Gate `POST /api/register/preflight` behind a shared secret. Off by default in dev.                                        |
| `TESTNET_REGISTER_SECRET` + `ENABLE_TESTNET_REGISTER`         | staging only | Gate `POST /api/testnet-register`. Defaults to `404`. Never enable in production.                                         |
| `SUMSUB_APP_TOKEN`/`SECRET_KEY`/`WEBHOOK_SECRET`/`LEVEL_NAME` | yes (KYC)    | Sumsub API and webhook HMAC.                                                                                              |
| `TOLT_API_KEY`                                                | no           | Server-side Tolt conversion.                                                                                              |
| `SLACK_ERROR_WEBHOOK_URL`                                     | no           | Receives non-warning server errors (filtered in `lib/errors.js`).                                                         |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN` | no           | Sentry server, browser, and source-map upload.                                                                            |
| `GCP_SERVICE_ACCOUNT_B64` + `CLOUD_SQL_INSTANCE_CONNECTION_NAME` + `DB_USER`/`DB_PASSWORD`/`DB_NAME` | prod-only | Cloud SQL Connector path (used when `DATABASE_URL` is not provided). |
| `DATABASE_CA_CERT` _or_ `DATABASE_CA_CERT_PATH`               | prod-only    | PEM contents (or filesystem path) of the Postgres CA. Required when connecting over TLS.                                  |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`         | prod-only    | Distributed rate limiter for `lib/rate-limit.js`. Falls back to in-process when unset.                                    |
| `VANTA_API_URL` _or_ `PTN_API_URL`                            | seed         | Vanta entity-miner backend URL. If unset, defaults to testnet/mainnet pods. Override when pointing at a local pod.        |
| `VANTA_API_KEY` _or_ `PTN_API_KEY`                            | seed         | Auth key for the Vanta entity-miner backend (written to the `vanta` row's `api_key`). **Distinct from `VALIDATOR_API_KEY`.** Required when `SKIP_ENTITY_MINER_CALL=false`. |
| `VANTA_ENTITY_HOTKEY` _or_ `PTN_ENTITY_HOTKEY`                | seed         | SS58 hotkey of the Vanta entity miner on the active network. Set per-environment. Same value as `vanta-ui`'s `PTN_ENTITY_HOTKEY`. |

## Scripts

| Command            | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `pnpm dev`         | Next dev server on **:4568**                         |
| `pnpm build`       | Production build                                     |
| `pnpm start`       | Run the production build                             |
| `pnpm lint`        | ESLint (flat config, React + hooks)                  |
| `pnpm test`        | Vitest unit suite                                    |
| `pnpm test:watch`  | Vitest in watch mode                                 |
| `pnpm db:push`     | Apply Drizzle schema to `DATABASE_URL`               |
| `pnpm db:generate` | Generate a new SQL migration from `lib/db/schema.js` |
| `pnpm db:migrate`  | Run pending migrations                               |
| `pnpm db:seed`     | Seed entity miners + tiers (`lib/db/seed.mjs`)       |
| `pnpm db:studio`   | Open Drizzle Studio against `DATABASE_URL`           |

Operational scripts under `scripts/` (run with `node scripts/<name>.mjs`):

- `refund.mjs` — issues USDC refunds on Base; needs `REFUND_PRIVATE_KEY`.
- `query-miners.mjs` — diagnostic dump of `entity_miners` and tiers.
- `apply-migration.mjs` — manual migration runner for non-Drizzle SQL.
- `add-affiliate.mjs` — insert a row in `affiliates`.
- `print-db-tables.js` — table size / row count summary.

## Repo map

```
app/                          Next.js 15 App Router
  api/                        Route handlers (the public/server surface)
  dashboard/                  Trader dashboard (wagmi providers)
  leaderboard/                Network leaderboard
  miner/[slug]/               Per-miner detail (dynamic)
  register/                   Multi-step registration
  status/                     Network status checker
components/                   UI by domain (marketing, dashboard, registration, …)
hooks/                        React Query + SSE streaming hooks
lib/
  db/                         Drizzle schema, client, seed, SSL helpers
  wallet-auth.js              EIP-191 signature verification + body-hash binding
  nonce-store.js              Postgres-backed replay protection
  rate-limit.js               Edge-friendly limiter (Upstash if configured)
  validator.js                Validator API client (with fetch timeout)
  parse-error-body.js         JSON-or-text parser for upstream error bodies
  validation.js               Address + payload validators
  errors.js, errors-slack.js  Centralized error reporting (Sentry + Slack)
  gateway.js                  Resolves entity-miner gateway URL + headers
  sumsub.js                   KYC HMAC + applicant lookups
docs/                         ARCHITECTURE.md, PHASES.md, decisions/, …
drizzle/                      Generated SQL + meta (do not edit by hand)
tests/                        Vitest unit suite + setup
middleware.js                 Hostname rewrites, affiliate cookies (NOT auth)
sentry.*.config.js            Server / edge / client Sentry init
vercel.json                   Cron schedule for /api/sync-registrations
```

## Database

Postgres + Drizzle ORM. Schema lives in [`lib/db/schema.js`](lib/db/schema.js):

- `entity_miners` — one row per miner (PK `hotkey`); holds API URL + key.
- `entity_tiers` — pricing/profit-split tiers per miner.
- `affiliates` — affiliate slug + use count.
- `users` — wallet ↔ KYC + affiliate (keyed by `wallet` = trader's HL address).
- `registrations` — per-purchase state (`status`, `status_detail jsonb`,
  `metadata jsonb` for the miner's `create-hl-subaccount` response, unique `tx_hash`).
- `auth_nonces` — replay-protection store for wallet-signed requests.

Migrations live in [`drizzle/`](drizzle/) and are applied with `drizzle-kit`.
**Do not hand-edit `drizzle/meta/`** — regenerate instead.

In production (Cloud SQL), connections go through
`@google-cloud/cloud-sql-connector` using `GCP_SERVICE_ACCOUNT_B64` +
`CLOUD_SQL_INSTANCE_CONNECTION_NAME`. For other Postgres hosts, supply
`DATABASE_CA_CERT` (PEM) or `DATABASE_CA_CERT_PATH` so TLS is properly
verified — see [`lib/db/index.js`](lib/db/index.js).

## API surface

Brief inventory; full request/response shapes live in
[`endpoint_docs.md`](endpoint_docs.md) and [`api_docs.md`](api_docs.md).

| Method | Path                       | Auth                                       |
| ------ | -------------------------- | ------------------------------------------ |
| GET    | `/api/entity`              | public (allowlisted columns only)          |
| GET    | `/api/miners/[slug]`       | public                                     |
| GET    | `/api/leaderboard`         | public                                     |
| GET    | `/api/dashboard`           | public (read-only proxy)                   |
| GET    | `/api/dashboard/stream`    | public SSE                                 |
| GET    | `/api/dashboard/events`    | public                                     |
| POST   | `/api/dashboard/payout`    | EVM signed (wallet-bound)                  |
| POST   | `/api/register`            | x402 / HL transfer proof                   |
| POST   | `/api/register/preflight`  | optional `PREFLIGHT_SECRET`                |
| POST   | `/api/register/retry`      | bearer `RETRY_SECRET`                      |
| POST   | `/api/testnet-register`    | env-gated (off by default)                 |
| GET    | `/api/registration-status` | public                                     |
| GET    | `/api/sync-registrations`  | bearer `CRON_SECRET`                       |
| POST   | `/api/vanta-sync`          | bearer `VANTA_SYNC_API_KEY`                |
| POST   | `/api/kyc/token`           | wallet ownership signature                 |
| GET    | `/api/kyc/status`          | wallet ownership signature                 |
| POST   | `/api/kyc/webhook`         | Sumsub HMAC                                |
| GET    | `/api/status`              | public                                     |
| GET    | `/api/hl-equity`           | public                                     |
| GET    | `/api/verify-hl-payment`   | rate-limited                               |

## Project policies

The strict project conventions live in [`CLAUDE.md`](CLAUDE.md). Highlights:

- JSX only — no TypeScript files.
- Tailwind v4 only (CSS variables in `globals.css`, no `tailwind.config.js`).
- Dev server is **always** `:4568`.
- API routes are stable surface — coordinate before changing them.
- No hardcoded secrets — everything goes through env.

For architectural background and recent decisions, see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/decisions/`](docs/decisions).
