import { test, expect } from "@playwright/test";
import {
  closePool,
  getLatestRegistrationFor,
  loadActiveTiersBySlug,
  purgeWallet,
} from "./fixtures/db.js";
import {
  fillHlAddressAndConfirm,
  selectTier,
  submitFreeSignup,
} from "./fixtures/onboarding.js";
import { E2E_MOCK_WALLET_ADDRESS } from "./fixtures/wallet.js";

// Full free-tier registration flow with the mocked wallet:
//   /register → select free tier → fill HL address → confirm details →
//   submit → DB row exists with status='registered' and metadata
//   captured from the (skipped) miner call.
//
// Side effects suppressed via env (`SKIP_ENTITY_MINER_CALL=true`,
// blank validator) — see playwright.config.js.

test.describe("Free-tier onboarding (mocked wallet)", () => {
  let freeTier;

  test.beforeAll(async () => {
    const tiers = await loadActiveTiersBySlug("vanta");
    freeTier = tiers.find((t) => Number(t.priceUsdc) === 0);
    expect(
      freeTier,
      "no free tier ($0) seeded for vanta; run `pnpm db:seed`",
    ).toBeTruthy();
  });

  test.beforeEach(async () => {
    // Start each test from a clean slate for the mocked wallet so the
    // duplicate-registration guard doesn't fire.
    await purgeWallet(E2E_MOCK_WALLET_ADDRESS);
  });

  test.afterAll(async () => {
    await purgeWallet(E2E_MOCK_WALLET_ADDRESS);
    await closePool();
  });

  test("free-tier signup writes a registered row to the DB", async ({
    page,
  }) => {
    await selectTier(page, { accountSize: freeTier.accountSize });

    await fillHlAddressAndConfirm(page, E2E_MOCK_WALLET_ADDRESS);

    await submitFreeSignup(page);

    // Poll for the row — the wizard's redirect sometimes races the
    // INSERT visibility window on a freshly-restarted dev server.
    const row = await waitForRegistration(E2E_MOCK_WALLET_ADDRESS);
    expect(row, "expected a registration row").toBeTruthy();
    expect(row.status).toBe("registered");
    expect(Number(row.account_size)).toBe(freeTier.accountSize);
    expect(Number(row.price_usdc)).toBe(0);
  });
});

async function waitForRegistration(hlAddress, { timeoutMs = 15_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = await getLatestRegistrationFor(hlAddress);
    if (row) return row;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}
