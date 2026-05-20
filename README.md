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
| `TESTNET_REGISTER_SECRET` + `ENABLE_TESTNET_REGISTER`         | staging only | Gate `POST /api/testnet-register`. Defaults to `404`. Never enable in production.                                         |
| `SUMSUB_APP_TOKEN`/`SECRET_KEY`/`WEBHOOK_SECRET`/`LEVEL_NAME` | yes (KYC)    | Sumsub API and webhook HMAC.                                                                                              |
| `TOLT_API_KEY`                                                | no           | Server-side Tolt conversion.                                                                                              |
| `SLACK_ERROR_WEBHOOK_URL`                                     | no           | Receives non-warning server errors (filtered in `lib/errors.js`).                                                         |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN` | no           | Sentry server, browser, and source-map upload.                                                                            |
| `GCP_SERVICE_ACCOUNT_B64` + `CLOUD_SQL_INSTANCE_CONNECTION_NAME` + `DB_USER`/`DB_PASSWORD`/`DB_NAME` | prod-only | Cloud SQL Connector path (used when `DATABASE_URL` is not provided). |
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
| `pnpm e2e`         | Playwright end-to-end suite (see [E2E tests](#e2e-tests)) |
| `pnpm e2e:ui`      | Playwright UI mode (interactive runner)              |
| `pnpm e2e:debug`   | Playwright inspector / step debugger                 |
| `pnpm e2e:install` | Install the Playwright Chromium browser (one-time)   |
| `pnpm db:push`     | Apply Drizzle schema to `DATABASE_URL`               |
| `pnpm db:generate` | Generate a new SQL migration from `lib/db/schema.js` |
| `pnpm db:migrate`  | Run pending migrations                               |
| `pnpm db:seed`     | Seed entity miners + tiers (`lib/db/seed.mjs`)       |
| `pnpm db:studio`   | Open Drizzle Studio against `DATABASE_URL`           |

Operational scripts under `scripts/` (run with `node scripts/<name>.mjs`):

- `refund.mjs` — issues USDC refunds on Base; needs `REFUND_PRIVATE_KEY`.
- `query-miners.mjs` — diagnostic dump of `entity_miners` and tiers.
- `apply-migration.mjs` — manual migration runner for non-Drizzle SQL.
- `add-affiliate.mjs` — upsert an `affiliates` row. Optional flags:
  `--parent=<slug>` to nest under another affiliate, `--miner=<slug>` to
  link the row to an `entity_miners` row (so the miner's slug becomes the
  recognized `?tenant=` value).
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
  db/                         Drizzle schema, client, seed
  wallet-auth.js              EIP-191 signature verification + body-hash binding
  nonce-store.js              Postgres-backed replay protection
  rate-limit.js               In-process per-IP/wallet limiter
  validator.js                Validator API client (with fetch timeout)
  parse-error-body.js         JSON-or-text parser for upstream error bodies
  validation.js               Address + payload validators
  errors.js, errors-slack.js  Centralized error reporting (Sentry + Slack)
  gateway.js                  Resolves entity-miner gateway URL + headers
  sumsub.js                   KYC HMAC + applicant lookups
docs/                         ARCHITECTURE.md, PHASES.md, decisions/, …
drizzle/                      Generated SQL + meta (do not edit by hand)
tests/                        Vitest unit suite + setup
proxy.js                      Hostname rewrites, affiliate cookies (NOT auth); Next.js 16 edge proxy
sentry.*.config.js            Server / edge / client Sentry init
vercel.json                   Cron schedule for /api/sync-registrations
```

## Database

Postgres + Drizzle ORM. Schema lives in [`lib/db/schema.js`](lib/db/schema.js):

- `entity_miners` — one row per miner (PK `hotkey`); holds API URL + key.
- `entity_tiers` — pricing/profit-split tiers per miner.
- `affiliates` — affiliate slug + use count. Self-referential via
  `parent_affiliate_id` for sub-affiliate hierarchies, and optionally linked
  to an `entity_miners` row via `entity_miner_hotkey` when the affiliate row
  represents a partner company that is also a miner (the "tenant" surface).
- `users` — wallet ↔ KYC + affiliate (keyed by `wallet` = trader's HL address).
- `registrations` — per-purchase state (`status`, `status_detail jsonb`,
  `metadata jsonb` for the miner's `create-hl-subaccount` response, unique `tx_hash`).
- `auth_nonces` — replay-protection store for wallet-signed requests.
- `coupons` / `coupon_redemptions` — promotional codes administered through
  `/command-center/promo-codes`. `coupons.allowed_tier_ids` is a JSONB array
  of tier slugs in the form `{miner-slug}:{account-size}` (for example,
  `vanta:5000`). Use the same convention when wiring discount validation into
  checkout so the slugs match what the admin UI persists.
- `command_center_staff` — wallet allowlist for `/command-center`. Seeded
  from `COMMAND_CENTER_STAFF_WALLETS` by `pnpm db:seed`.
- `referral_clicks` — raw click stream written from the edge proxy whenever a
  visitor lands with `?affiliate=`, `?tenant=`, or `?promo=`. Includes a
  hashed IP (`ip_hash`), referrer, and the minted `click_id` that round-trips
  through the `hs_attr` cookie.
- `referral_attributions` — per-user attribution row keyed by `user_id`
  (UNIQUE). Inserted in `/api/register` from the signed `hs_attr` cookie
  on the user's first paid registration; the UNIQUE constraint pins the row
  to that first-signup cookie state, even though the cookie itself is
  last-touch (see *Affiliate attribution* below).
- `registration_attributions` — denormalized conversion ledger linking each
  paid registration to its attribution row plus the affiliate/tenant/promo
  context. Drives `/command-center/attributions` reporting and CSV exports.

Migrations live in [`drizzle/`](drizzle/) and are applied with `drizzle-kit`.
**Do not hand-edit `drizzle/meta/`** — regenerate instead.

In production (Cloud SQL), connections go through
`@google-cloud/cloud-sql-connector` using `GCP_SERVICE_ACCOUNT_B64` +
`CLOUD_SQL_INSTANCE_CONNECTION_NAME` — the connector handles channel
encryption internally, so no client-side CA bundle is needed.
See [`lib/db/index.js`](lib/db/index.js).

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
| POST   | `/api/register`            | HL ownership signature + x402 / HL transfer proof |
| POST   | `/api/register/preflight`  | public                                     |
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
| POST   | `/api/command-center/session` | wallet signature (sets admin cookie)     |
| POST   | `/api/command-center/security-token` | extends admin cookie (`COMMAND_CENTER_SECURITY_TOKEN`) |
| DELETE | `/api/command-center/session` | clears admin cookie                      |
| GET    | `/api/command-center/export/coupons` | command-center cookie             |
| GET    | `/api/command-center/export/attributions` | command-center cookie        |
| POST   | `/api/track/click`         | public (writes `referral_clicks`; idempotent on `click_id`) |

### Command Center

`/command-center` is the wallet-gated admin surface. The gate
(`requireCommandCenterStaff()`) mirrors vanta-ui's `requireAdmin()` behavior:
missing session → redirect to `/command-center/login`; signed in but not on
the staff allowlist → `notFound()`. When `COMMAND_CENTER_SECURITY_TOKEN` is
set (non-empty), wallet sign-in is followed by `/command-center/security-token`
where staff must submit that shared secret; the session cookie carries a
`secured` flag until then. Omit the env variable in environments where wallet +
allowlist alone is enough. Authorize wallets by adding them to
`COMMAND_CENTER_STAFF_WALLETS` and running `pnpm db:seed`.

Pages:

- `/command-center/promo-codes` — promotional codes (Phase 1).
- `/command-center/affiliates` — affiliate CRUD with parent / tenant
  pickers and a per-row share-link generator that produces
  `?affiliate=&tenant=&promo=` URLs ready to send to partners.
- `/command-center/attributions` — clicks → signups → conversions report
  with date / affiliate / tenant / promo filters and CSV + JSON export.

### Registration ownership vs. payment

`POST /api/register` decouples two concerns that were briefly conflated in
earlier builds:

- **HL ownership** — proven by an EIP-191 signature from the HL trading
  wallet over the request body (`x-wallet`/`x-signature`/`x-nonce`,
  verified by `lib/wallet-auth.js`). The server gate compares
  `auth.wallet === hlAddress`; without that match, the request is
  rejected as 401/403 regardless of payment.
- **Payment authorization** — proven by whatever wallet signs the actual
  payment: the x402 EIP-3009 payload for the Base path
  (`paymentPayload.payload.authorization.from`), or the HL EIP-712
  `usdSend` for the Hyperliquid path. The server does NOT require this
  to equal `hlAddress`.

This lets the Base path (`Pay with Wallet — USDC on Base`) accept a
**different paying wallet** than the HL trading wallet. The client
(`components/registration/step-connect-pay.jsx`) implements that as a
sign-then-swap flow:

1. User connects HL, clicks **Pay from a different wallet**.
2. We approve the Hyperscaled builder fee on HL (HL-side approval),
   then sign HL ownership over a body whose payoutAddress is pinned
   to `hlAddress` and which omits `hlTransferSender`. The signed
   bytes + headers are cached in component state.
3. RainbowKit pops; user connects any paying wallet.
4. On submit, the cached HL ownership headers are replayed and the
   x402 payment is signed by the now-connected paying wallet. If the
   user changes any signed-over field (HL, miner, tier, payout, email,
   coupon) between step 2 and submit, the cached bundle is invalidated
   and the user must re-sign from HL.

Helpers and invariants are factored into `lib/registration-base-body.js`
and unit tested in `tests/unit/registration-base-body.test.js`.

### Affiliate attribution

External partners send traffic to hyperscaled with query parameters:

```
https://hyperscaled.com/?affiliate=<slug>&tenant=<miner-slug>&promo=<CODE>
```

Resolution flow:

1. The edge proxy (`proxy.js`) reads the parameters on every visit, mints a
   UUID `click_id`, and writes a 90-day HMAC-signed `hs_attr` cookie carrying
   `{affiliate, tenant, promo, clickId, firstTouchAt}`. The cookie is
   **last-touch**: any subsequent visit whose URL still carries an explicit
   `?affiliate=`, `?tenant=`, or `?promo=` overwrites the cookie, so the
   partner who drove the most recent click owns the conversion. Bare visits
   (no explicit signals) leave the cookie alone, so returning organic traffic
   does not drop attribution.
2. The proxy fires-and-forgets `POST /api/track/click`, which validates the
   slugs and inserts a `referral_clicks` row (idempotent on `click_id`). Prefetch
   (`Next-Router-Prefetch`, `Sec-Fetch-Purpose: prefetch`, `?_rsc=`) replay the
   same URL and **do not** increment clicks; duplicate proxy passes within a
   short window (~600 ms for the same IP + path + query) merge to one signal.
3. When the visitor signs up, `/api/register` reads `hs_attr` and inserts a
   `referral_attributions` row keyed by `user_id`. The row is
   `ON CONFLICT (user_id) DO NOTHING`, so it pins the per-user record to
   the cookie state at the **first paid signup**; cookie changes after that
   only show up in the per-conversion `registration_attributions` row, which
   reflects the cookie at conversion time.
4. `/command-center/attributions` aggregates the three tables for reporting.

Implicit tenant attribution: traffic on partner-branded surfaces
(`hs.vantatrading.io`, `beanstocktrading.com`, and the `/lunarcrush`,
`/vanta`, `/beanstock`, `/wsb`, `/bitcast` path prefixes) is auto-credited
to the matching tenant **only when** the URL also carries an `?affiliate=`
or `?promo=` signal — this prevents organic traffic from being silently
attributed.

The `hs_attr` cookie is signed with `ATTRIBUTION_COOKIE_SECRET` (falling
back to `COMMAND_CENTER_SESSION_SECRET` if unset). Rotate the secret to
invalidate every visitor's pending attribution; persisted
`referral_attributions` rows are unaffected.

## E2E tests

Playwright suite covering the registration wizard, tenant brand routes, and
dashboard chrome. The runner spawns its own Next dev server on `:4569` (next
to your dev `:4568`), boots it with the wagmi `mock` connector, and reads
`entity_tiers` straight from your local Postgres. External services
(validator, miner gateway) are short-circuited via env so the suite has no
outbound network dependencies.

```bash
pnpm e2e:install     # one-time: downloads bundled Chromium
pnpm e2e             # headless, full suite (~2 min cold, ~30s warm)
pnpm e2e:ui          # interactive runner
```

Full setup, env vars, scenario coverage, and troubleshooting live in
[`tests/e2e/README.md`](tests/e2e/README.md). E2E-only escape hatches
(`E2E_BYPASS_WALLET_AUTH`, `E2E_VALIDATOR_FALLBACK_STATUS`,
`NEXT_PUBLIC_E2E_MOCK_WALLET`) are hard-blocked when `NODE_ENV=production`.

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
