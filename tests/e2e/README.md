# E2E Tests (Playwright)

End-to-end coverage for the registration wizard, dashboard chrome, and
brand-aware routing. Same pattern as `vanta-ui/tests/e2e`: real Postgres,
real Next dev server on a dedicated port, but with the wallet replaced
by wagmi's `mock` connector and miner/validator side effects suppressed
via env. No funded testnet wallet, no MetaMask extension required.

## Specs

| Spec | What it covers |
|---|---|
| `tier-selection.spec.js` | Every active tier from the DB renders on `/register` and `/pricing` with the correct price. No DB writes. |
| `deep-link.spec.js` | Clicking a tier card on `/pricing` deep-links to `/register?tier=<size>` and lands on step 1 (Connect & Pay) without flashing step 0. |
| `tenant-brands.spec.js` | `/beanstock`, `/bitcast`, `/lunarcrush` register pages render their tier list, the Exit button targets the tenant home, the logo links to the external brand site. |
| `onboarding-free.spec.js` | Full free-tier flow: select tier → fill HL address → confirm → submit → DB row written with `status='registered'`. |
| `wallet-ownership.spec.js` | Typing an HL address that doesn't match the connected wallet shows the amber mismatch banner and disables the Sign Up button. |
| `duplicate-registration.spec.js` | A pre-seeded `registered` row blocks re-registration and surfaces a clean error in the UI. |
| `stale-pending.spec.js` | A pre-seeded stale `pending` row is reconciled and a fresh registration succeeds. |
| `dashboard-nav.spec.js` | The "Start Challenge" CTA hides when the connected wallet has an active registration. The wallet-mismatch KYC card is absent on dashboards the connected wallet does not own. |

## Prerequisites

1. **Browsers installed once per machine**

   ```bash
   pnpm e2e:install
   ```

2. **Postgres** with the schema migrated and tiers seeded:

   ```bash
   pnpm db:push
   pnpm db:seed
   ```

3. **Required env vars** (set in `.env.local` or the shell that runs
   Playwright):

   | Variable | Why |
   |---|---|
   | `DATABASE_URL` | Tests read tier rows and write/read registration rows. Set `E2E_DATABASE_URL` to override just for tests. |

   The Playwright config injects the following into the spawned dev server:

   - `NEXT_PUBLIC_E2E_MOCK_WALLET=true` — swaps wagmi connectors for a
     deterministic `mock` connector.
   - `NEXT_PUBLIC_E2E_MOCK_ADDRESS=<addr>` — the auto-connected wallet
     address. Defaults to `0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1`.
   - `SKIP_ENTITY_MINER_CALL=true` — registration completes without
     calling the real miner gateway.
   - `VALIDATOR_API_URL=`, `VALIDATOR_API_KEY=`, `VANTA_API_URL=`,
     `VANTA_API_KEY=` — blank so any stray fetch fails soft.
   - `ENABLE_TESTNET_REGISTER=false` — defensively disabled.

4. **Optional env vars**

   | Variable | Default | Purpose |
   |---|---|---|
   | `E2E_PORT` | `4569` | Port the test webserver listens on (next to dev's `4568`). |
   | `E2E_BASE_URL` | `http://localhost:${E2E_PORT}` | Override to run against a deployed environment. |
   | `E2E_SKIP_WEB_SERVER` | unset | Set to `1` when targeting a server you started yourself. |
   | `E2E_DATABASE_URL` | falls back to `DATABASE_URL` | Point tests at a separate test DB. |
   | `E2E_MOCK_WALLET_ADDRESS` | `0x14b2eb14...` | Override the deterministic mocked wallet. |

## Running

```bash
# headless run, full suite
pnpm e2e

# interactive UI (recommended while iterating)
pnpm e2e:ui

# step through with the inspector
pnpm e2e:debug

# headed (real browser window, no inspector)
pnpm e2e:headless

# single spec / single test
pnpm e2e tests/e2e/onboarding-free.spec.js
pnpm e2e -g "wallet ownership"
```

The HTML report is written to `playwright-report/`; open it with
`pnpm e2e:report` after a run.

### First run is slow — that's normal

Playwright spawns its own `next dev` server on port 4569 and waits for
it to respond before any test runs. The first compile takes ~30-60s
(every route plus middleware), during which you'll see the standard
Next dev output (`✓ Compiled /...`). Subsequent runs are much faster
because Next caches.

If you want to skip the spawn (e.g. you already have the dev server
running on 4569), set `E2E_SKIP_WEB_SERVER=1`:

```bash
NEXT_PUBLIC_E2E_MOCK_WALLET=true \
NEXT_PUBLIC_E2E_MOCK_ADDRESS=0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1 \
SKIP_ENTITY_MINER_CALL=true \
VALIDATOR_API_URL= VALIDATOR_API_KEY= VANTA_API_URL= VANTA_API_KEY= \
pnpm next dev -p 4569
# then in another shell:
E2E_SKIP_WEB_SERVER=1 pnpm e2e
```

## How the wallet mock works

The wagmi config in `lib/wagmi.js` reads `NEXT_PUBLIC_E2E_MOCK_WALLET`
at module load. When set, it replaces the production RainbowKit
connectors with a single wagmi `mock` connector pre-connected to
`NEXT_PUBLIC_E2E_MOCK_ADDRESS`. Specs see `useAccount()` return
`{ isConnected: true, address: <mock> }` on first render — no popup,
no extension.

This means **all tests share the same connected address** for a single
`pnpm test:e2e` run. Scenarios that need a "different wallet"
(ownership mismatch, viewing someone else's dashboard) **vary the
typed HL address or the URL path**, not the connected wallet.

## How miner / validator side effects are suppressed

The Playwright config blanks `VALIDATOR_API_URL`, `VANTA_API_URL`, and
their keys, and sets `SKIP_ENTITY_MINER_CALL=true`. With those:

- `/api/register` short-circuits the miner gateway call, marks the row
  `registered`, and returns success immediately.
- The validator-status check in preflight returns "no row" rather than
  hitting the network, so deduping behaves the same as a clean DB.
### Why there's no e2e for the miner-timeout scenario

The miner-gateway 504 path is already covered by
`tests/unit/api-register-business.test.js` ("returns 502 and writes
NO `pending` row when miner times out"). That suite mocks the global
`fetch` directly, which is the right layer — Playwright's
`page.route` only intercepts browser-initiated requests, but the
miner call is a *server-side* fetch from `/api/register`. Adding an
e2e for it would require running a side-car mock HTTP server during
the suite, which buys nothing the unit test doesn't already cover.

## Adding a new spec

Page-object-style helpers live in `fixtures/onboarding.js` —
`selectTier`, `gotoRegisterDeepLinked`, `fillHlAddressAndConfirm`,
`submitFreeSignup`, `tierCardByAccountSize`, `pricingCardByAccountSize`.
Prefer extending those over duplicating selectors inside specs. DB
helpers live in `fixtures/db.js` — `loadActiveTiersBySlug`,
`seedRegistration`, `purgeWallet`, `getLatestRegistrationFor`.

## Troubleshooting

- **`pnpm e2e` shows `> playwright test` and then nothing** — Playwright
  is spawning the dev server (silent on first compile). With the
  `stdout: "inherit"` config you should now see Next's compile
  progress; if you don't, the dev-server start command is failing —
  try running `pnpm next dev -p 4569` manually to see the error, then
  restart `pnpm e2e`.
- **`E2E tests require E2E_DATABASE_URL or DATABASE_URL to be set`** —
  the runner couldn't see your `.env.local`. Either run `pnpm e2e`
  from the repo root, or export `DATABASE_URL` in the shell.
- **`No active tiers found in DB`** — run `pnpm db:seed` before the
  suite. The tier-selection spec asserts on the seeded tier list.
- **Connected wallet shows `0x000…0000` or "not connected"** — the
  `NEXT_PUBLIC_E2E_MOCK_WALLET` env didn't reach the dev server. Did
  you start the server manually with `pnpm dev`? Either kill it and
  let Playwright spawn its own (default), or start it with
  `NEXT_PUBLIC_E2E_MOCK_WALLET=true NEXT_PUBLIC_E2E_MOCK_ADDRESS=… pnpm next dev -p 4569`
  and pass `E2E_SKIP_WEB_SERVER=1` to Playwright.
- **`Timed out waiting for tier-card`** — usually means the dev server
  is still compiling the registration route on first hit. Re-run; the
  second compile is cached.
