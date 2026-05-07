import { test, expect } from "@playwright/test";
import {
  closePool,
  loadActiveTiersBySlug,
  purgeWallet,
} from "./fixtures/db.js";
import { selectTier } from "./fixtures/onboarding.js";
import {
  E2E_MOCK_WALLET_ADDRESS,
  E2E_OTHER_WALLET_ADDRESS,
} from "./fixtures/wallet.js";

// The wizard verifies that the typed HL address matches the connected
// wallet *before* it offers to register or sign anything. Typing a
// different address must:
//   1. Surface an amber "Wallet doesn't match" banner
//   2. Disable the Sign Up button
//
// This is the regression that broke during a prior refactor — the
// guard fired on submit instead of on input change, so users got all
// the way to MetaMask before learning their wallets didn't line up.

test.describe("Wallet ownership UX guard", () => {
  let freeTier;

  test.beforeAll(async () => {
    const tiers = await loadActiveTiersBySlug("vanta");
    freeTier = tiers.find((t) => Number(t.priceUsdc) === 0) ?? tiers[0];
    expect(freeTier).toBeTruthy();
  });

  test.beforeEach(async () => {
    await purgeWallet(E2E_MOCK_WALLET_ADDRESS);
    await purgeWallet(E2E_OTHER_WALLET_ADDRESS);
  });

  test.afterAll(async () => {
    await purgeWallet(E2E_MOCK_WALLET_ADDRESS);
    await purgeWallet(E2E_OTHER_WALLET_ADDRESS);
    await closePool();
  });

  test("typing a non-matching HL address shows the mismatch banner and disables Sign Up", async ({
    page,
  }) => {
    await selectTier(page, { accountSize: freeTier.accountSize });

    // The wizard pre-fills the HL wallet from the connected (mocked)
    // address. Click "Change" to enter edit mode so we can override
    // it with a non-matching address.
    const changeBtn = page.locator('[data-testid="hl-wallet-change"]');
    if (await changeBtn.isVisible().catch(() => false)) {
      await changeBtn.click();
    }

    // Type the OTHER address — different from the mocked connected wallet.
    const input = page.locator("#hl-wallet");
    await expect(input).toBeVisible();
    await input.fill(E2E_OTHER_WALLET_ADDRESS);
    await input.evaluate((el) => el.blur());

    const banner = page.locator(
      '[data-testid="wallet-ownership-mismatch-banner"]',
    );
    await expect(banner).toBeVisible({ timeout: 10_000 });
    await expect(banner).toContainText(/wallet doesn['’]t match/i);

    // Sign Up button must be disabled — the wizard refuses to submit
    // until ownership lines up. (`continue-to-review` is the gate on
    // step 1; the Sign Up button is on step 2 and only renders after
    // we advance past this guard, so we assert on continue-to-review.)
    const continueBtn = page.locator('[data-testid="continue-to-review"]');
    await expect(continueBtn).toBeDisabled();

    // Switching back to the mocked address dismisses the banner and
    // re-enables the form. (Blurring with a valid value flips us back
    // into display mode, so re-enter edit mode first.)
    if (await changeBtn.isVisible().catch(() => false)) {
      await changeBtn.click();
    }
    await input.fill(E2E_MOCK_WALLET_ADDRESS);
    await input.evaluate((el) => el.blur());
    await expect(banner).toHaveCount(0);
  });
});
