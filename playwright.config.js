import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Load `.env`, `.env.local`, etc. into the Playwright runner's
// `process.env` BEFORE we read any of them below. This is the same
// loader Next uses, so precedence rules (`.env.local` over `.env`,
// dotenv expansion, etc.) match what the spawned dev server sees.
// Without this, the test runner (which is a separate Node process
// from `next dev`) has no access to DATABASE_URL — fixtures like
// `db.js` would throw "DATABASE_URL not set" before any test runs.
loadEnvConfig(process.cwd());

// E2E tests run against a Next dev server on a non-default port so they
// don't fight a developer's `pnpm dev` on :4568. Override with E2E_PORT
// or E2E_BASE_URL if needed.
const PORT = Number(process.env.E2E_PORT ?? 4569);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

// When set to "1", Playwright assumes the user already started the app
// and won't try to spawn its own webServer. Useful for debugging or
// when running against a deployed environment.
const SKIP_WEB_SERVER = process.env.E2E_SKIP_WEB_SERVER === "1";

// Deterministic mock wallet address. Fixtures and seed helpers use
// this same constant so DB rows we insert line up with the connected
// wallet wagmi reports inside the spawned dev server.
const MOCK_WALLET_ADDRESS =
  process.env.E2E_MOCK_WALLET_ADDRESS ||
  "0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1";

export default defineConfig({
  testDir: "./tests/e2e",
  // E2E specs write/read DB rows; serialize so two specs never race on
  // the same wallet address or registration row.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  // Must stay comfortably above `navigationTimeout` below: a single cold
  // navigation can consume most of the budget, and we still need room for
  // the assertions that follow it.
  timeout: 180_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    // First cold compile of heavy routes under `next dev` (Turbopack) is
    // slow because the whole route module graph + client bundle compiles
    // on first request. In isolation /register-style routes take ~15-30s,
    // but the per-tenant register routes (/bitcast/register, etc.) are only
    // exercised by tenant-brands.spec.js, so they compile *last* in this
    // serialized (workers:1) suite — and when the dev machine is also
    // running other builds, that first navigation regularly blows past 60s.
    // Locally `retries: 0`, so a single cold-compile timeout is a hard
    // failure. Give the first navigation generous headroom instead.
    navigationTimeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: SKIP_WEB_SERVER
    ? undefined
    : {
        command: `pnpm next dev -p ${PORT}`,
        url: BASE_URL,
        timeout: 240_000,
        // If this is true locally, Playwright may attach to an already-running
        // `next dev` on E2E_PORT that was started *without* the env below
        // (caps, mock wallet, validator fallbacks). Only opt into reuse when
        // you intentionally started the server with matching env.
        reuseExistingServer: process.env.E2E_REUSE_DEV_SERVER === "1",
        // Stream the dev-server output to the terminal locally so the
        // user can see compile progress (first run takes ~30-60s for
        // the registration route). In CI we keep it piped because the
        // GitHub reporter merges its own logs and the dev-server
        // output is noisy.
        stdout: process.env.CI ? "pipe" : "inherit",
        stderr: process.env.CI ? "pipe" : "inherit",
        env: {
          // Surface the chosen port to the app code in case anything
          // builds absolute URLs from it.
          PORT: String(PORT),
          // Boot the wagmi config with the deterministic mock connector
          // so RainbowKit doesn't try to open a real wallet popup.
          NEXT_PUBLIC_E2E_MOCK_WALLET: "true",
          NEXT_PUBLIC_E2E_MOCK_ADDRESS: MOCK_WALLET_ADDRESS,
          // The mock connector returns an address but cannot actually
          // sign messages (no private key). Bypass the wallet-signature
          // check on /api/register so registrations complete in tests.
          // Hard-blocked when NODE_ENV=production by lib/wallet-auth.js.
          E2E_BYPASS_WALLET_AUTH: "true",
          // Skip the post-registration call to the entity miner gateway.
          // The free-tier path still completes and writes the row to DB.
          SKIP_ENTITY_MINER_CALL: "true",
          // Blank validator/miner credentials so any stray fetch fails
          // soft instead of hitting a real network. Same pattern as
          // vanta-ui's e2e config — keeps tests deterministic.
          VALIDATOR_API_URL: "",
          VALIDATOR_API_KEY: "",
          VANTA_API_URL: "",
          VANTA_API_KEY: "",
          // Force the validator status to "not_found" so /api/register's
          // stale-pending reconciliation can fire (the real check would
          // return "unknown" with no validator URL, which is treated as
          // "still registered" — safe for prod but blocks our test).
          // Hard-blocked when NODE_ENV=production by lib/validator.js.
          E2E_VALIDATOR_FALLBACK_STATUS: "not_found",
          // Hard-disable the testnet free-money endpoint defensively.
          ENABLE_TESTNET_REGISTER: "false",
          // Override any host `.env.local` caps so /api/register/capacity does
          // not disable the free tier or swap pricing CTAs for "sold out" UI.
          REGISTRATION_FREE_MAX: "",
          REGISTRATION_PAID_MAX: "",
        },
      },
});
