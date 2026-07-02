// Wallet helpers for E2E. The Next dev server we spawn is booted with
// `NEXT_PUBLIC_E2E_MOCK_WALLET=true`, which swaps `lib/wagmi.js`'s
// connectors for a single `mock` connector that auto-connects to a
// deterministic address. The address is chosen at module load via
// `NEXT_PUBLIC_E2E_MOCK_ADDRESS`, baked into the bundle, and shared
// across all tests in a run.
//
// That means we cannot switch addresses per-test on a single dev
// server. Instead, every test uses the SAME mocked address (the one
// pinned in `playwright.config.js`) and varies the *typed* HL address
// or the URL path for scenarios that need a non-owner perspective.

export const E2E_MOCK_WALLET_ADDRESS =
  process.env.E2E_MOCK_WALLET_ADDRESS ||
  "0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1";

// A second, *different* address used by tests that simulate viewing a
// dashboard you don't own, or registering an HL address that doesn't
// match the connected wallet. Not connected anywhere — just a label.
export const E2E_OTHER_WALLET_ADDRESS =
  "0x000000000000000000000000000000000000bEEF";

// Deterministic SumSub webhook secret. `playwright.config.js` injects this into
// the spawned dev server's env so `verifyWebhookSignature` (which reads
// SUMSUB_WEBHOOK_SECRET) accepts the HMACs the webhook spec computes. Sharing
// one constant keeps the runner and the server in sync.
export const E2E_SUMSUB_WEBHOOK_SECRET = "e2e-sumsub-webhook-secret";
