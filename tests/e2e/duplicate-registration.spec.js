import { test, expect } from "@playwright/test";
import {
  closePool,
  loadActiveTiersBySlug,
  purgeWallet,
  seedRegistration,
} from "./fixtures/db.js";
import {
  fillHlAddressAndConfirm,
  selectTier,
} from "./fixtures/onboarding.js";
import { E2E_MOCK_WALLET_ADDRESS } from "./fixtures/wallet.js";

// When the wallet already has an active `registered` row, the wizard
// must surface a clean "already registered" message — not hang for
// minutes (the original bug) and not silently succeed.

test.describe("Duplicate registration guard", () => {
  let freeTier;

  test.beforeAll(async () => {
    const tiers = await loadActiveTiersBySlug("vanta");
    // Use the free tier — same preflight path runs, but we don't need
    // to pick a payment method to advance to the review step.
    freeTier = tiers.find((t) => Number(t.priceUsdc) === 0);
    expect(
      freeTier,
      "no free tier ($0) seeded for vanta; run `pnpm db:seed`",
    ).toBeTruthy();
  });

  test.beforeEach(async () => {
    await purgeWallet(E2E_MOCK_WALLET_ADDRESS);
  });

  test.afterAll(async () => {
    await purgeWallet(E2E_MOCK_WALLET_ADDRESS);
    await closePool();
  });

  test("an existing registered row blocks re-registration with a friendly error", async ({
    page,
  }) => {
    await seedRegistration({
      hlAddress: E2E_MOCK_WALLET_ADDRESS,
      status: "registered",
      accountSize: freeTier.accountSize,
      tierIndex: 0,
      priceUsdc: "0.00",
      txHash: `0xseed${Date.now().toString(16)}`,
    });

    await selectTier(page, { accountSize: freeTier.accountSize });
    await fillHlAddressAndConfirm(page, E2E_MOCK_WALLET_ADDRESS);

    // Submit the free signup so /api/register runs preflight against
    // the seeded duplicate row.
    const signUp = page.locator('[data-testid="free-signup"]');
    await expect(signUp).toBeEnabled({ timeout: 15_000 });
    await signUp.click();

    // The wizard should surface the duplicate-registration error
    // returned by the API. The exact copy varies (preflight returns
    // `{ error: "..." }` and the UI surfaces it verbatim), so match
    // on intent.
    await expect(
      page.getByText(/already.*registered|active.*registration|HL address.*registered/i),
    ).toBeVisible({ timeout: 30_000 });
  });
});
