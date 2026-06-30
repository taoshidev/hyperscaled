import { test, expect } from "@playwright/test";
import {
  closePool,
  loadActiveTiersBySlug,
  loadActiveCampaignForSlug,
} from "./fixtures/db.js";
import {
  pricingCardByAccountSize,
  tierCardByAccountSize,
} from "./fixtures/onboarding.js";
import { listPriceUsdcFromDbTier } from "../../lib/wsb-tier-list-price.js";

// Mirror of `applyCampaignToTierPrice` + `computeCouponDiscount` so the price
// assertion accounts for an active promotional campaign (the /pricing storefront
// shows the campaign-discounted price as the headline). Falls back to the list
// price when no campaign is active.
function campaignAdjustedPrice(listPrice, accountSize, campaign) {
  const original = Number(listPrice);
  if (!campaign || original <= 0) return original;

  const overrides = campaign.tierPriceOverrides;
  if (overrides && typeof overrides === "object") {
    const raw = overrides[String(accountSize)];
    if (raw != null && Number.isFinite(Number(raw))) {
      return Math.max(0, Number(raw));
    }
  }

  const dv = Number(campaign.discountValue);
  const rawDiscount =
    campaign.discountType === "percent"
      ? (original * dv) / 100
      : Math.min(dv, original);
  // Mirror computeCouponDiscount: the payable amount is rounded UP to a whole
  // dollar for real ($1+) prices so the headline price is cents-free.
  const centsFinal = Math.round(Math.max(0, original - rawDiscount) * 100) / 100;
  return centsFinal >= 1 ? Math.ceil(centsFinal) : centsFinal;
}

// The cheapest spec in the suite: no DB writes, no wallet, no
// registration. Just asserts the wizard's tier list and the marketing
// /pricing list render every active row from `entity_tiers` for the
// default miner. Catches "tier list empty" regressions like the one we
// hit on /beanstock/register when the seed was missing the row.

test.describe("Tier selection", () => {
  let tiers;
  let activeCampaign;

  test.beforeAll(async () => {
    tiers = await loadActiveTiersBySlug("vanta");
    expect(
      tiers.length,
      "no active vanta tiers found in DB; run `pnpm db:seed`",
    ).toBeGreaterThan(0);
    activeCampaign = await loadActiveCampaignForSlug("vanta");
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
      const listPrice = listPriceUsdcFromDbTier(
        "vanta",
        tier.accountSize,
        Number(tier.priceUsdc),
      );
      const expectedNumber = Math.round(
        campaignAdjustedPrice(listPrice, tier.accountSize, activeCampaign),
      );
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
