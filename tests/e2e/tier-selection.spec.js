import { test, expect } from "@playwright/test";
import {
  closePool,
  loadActiveTiersBySlug,
} from "./fixtures/db.js";
import {
  pricingCardByAccountSize,
  tierCardByAccountSize,
} from "./fixtures/onboarding.js";

// The cheapest spec in the suite: no DB writes, no wallet, no
// registration. Just asserts the wizard's tier list and the marketing
// /pricing list render every active row from `entity_tiers` for the
// default miner. Catches "tier list empty" regressions like the one we
// hit on /beanstock/register when the seed was missing the row.

test.describe("Tier selection", () => {
  let tiers;

  test.beforeAll(async () => {
    tiers = await loadActiveTiersBySlug("vanta");
    expect(
      tiers.length,
      "no active vanta tiers found in DB; run `pnpm db:seed`",
    ).toBeGreaterThan(0);
  });

  test.afterAll(async () => {
    await closePool();
  });

  test("registration wizard renders every active tier card", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: /Choose your .* account size/i }),
    ).toBeVisible();

    for (const tier of tiers) {
      const card = tierCardByAccountSize(page, tier.accountSize);
      await expect(
        card,
        `expected wizard tier card for accountSize=${tier.accountSize}`,
      ).toBeVisible();
    }
  });

  test("/pricing renders every paid tier with the correct headline price", async ({
    page,
  }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /One fee\. One challenge\./i }),
    ).toBeVisible();

    for (const tier of tiers) {
      const card = pricingCardByAccountSize(page, tier.accountSize);
      await expect(
        card,
        `expected pricing tier card for accountSize=${tier.accountSize}`,
      ).toBeVisible();

      // Free tier ($0) renders as "$0" without decimals; paid tiers
      // render the integer dollar amount. Strip non-digits and compare
      // numerically so we tolerate "$59.00" vs "$59" formatting drift.
      const displayed = await card
        .locator('[data-testid="pricing-tier-launch-price"]')
        .innerText();
      const displayedNumber = Number(displayed.replace(/[^\d.]/g, ""));
      const expectedNumber = Math.round(Number(tier.priceUsdc));
      expect(
        Math.round(displayedNumber),
        `tier accountSize=${tier.accountSize} expected price ${expectedNumber}`,
      ).toBe(expectedNumber);
    }
  });

  test("clicking a wizard tier card advances to step 1 (Connect & Pay)", async ({
    page,
  }) => {
    await page.goto("/register");

    const target = tiers.find((t) => t.accountSize > 0) ?? tiers[0];
    const card = tierCardByAccountSize(page, target.accountSize);

    await card.click();

    // Use the bottom "Continue" button (sibling of the cards), not the
    // inline one nested inside the card's outer <button> — see comment
    // in fixtures/onboarding.js for the rationale.
    await page.locator('[data-testid="select-tier-continue"]').click();

    // Step 1 (Connect & Pay) renders the "Continue to review" button.
    // We use that as the "we landed" signal because `#hl-wallet` is
    // hidden when the wizard pre-fills the HL wallet from the
    // connected (mocked) address.
    await expect(
      page.locator('[data-testid="continue-to-review"]'),
    ).toBeVisible({ timeout: 15_000 });
  });
});
