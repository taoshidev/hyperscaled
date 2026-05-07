import { test, expect } from "@playwright/test";
import {
  closePool,
  loadActiveTiersBySlug,
} from "./fixtures/db.js";
import {
  pricingCardByAccountSize,
} from "./fixtures/onboarding.js";

// Asserts that clicking a tier card on /pricing deep-links to
// /register?tier=<accountSize> AND lands on step 1 without ever
// flashing step 0 (the "Choose your … account size" heading). This
// regression hit during the multi-tenancy work — the wizard would
// briefly render step 0 before async tier data resolved.

test.describe("Deep link from /pricing → /register", () => {
  let tiers;

  test.beforeAll(async () => {
    tiers = await loadActiveTiersBySlug("vanta");
    expect(tiers.length).toBeGreaterThan(0);
  });

  test.afterAll(async () => {
    await closePool();
  });

  test("clicking a paid pricing card lands directly on step 1", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: /One fee\. One challenge\./i }),
    ).toBeVisible();

    // Pick the cheapest paid tier (skip free, which has its own deep
    // link CTA copy).
    const target =
      tiers.find((t) => Number(t.priceUsdc) > 0 && t.accountSize > 0) ??
      tiers[0];

    const card = pricingCardByAccountSize(page, target.accountSize);
    const cta = card.locator('[data-testid="pricing-tier-cta"]');

    // Capture the href before clicking so we can assert the URL shape
    // is what the deep-link contract promises.
    const href = await cta.getAttribute("href");
    expect(href, "pricing CTA must carry a tier deep link").toContain(
      `/register?tier=${target.accountSize}`,
    );

    // Use Promise.all so we begin waiting for the navigation BEFORE
    // the click fires — `cta.click()` then `expect(page).toHaveURL`
    // races and can miss a fast Next.js client-side transition.
    // `waitUntil: "commit"` returns as soon as the URL changes — the
    // default (`load`) waits for the `load` event which can take
    // longer than 15s on the first cold compile of /register in dev.
    await Promise.all([
      page.waitForURL(
        new RegExp(`/register\\?.*tier=${target.accountSize}`),
        { timeout: 30_000, waitUntil: "commit" },
      ),
      cta.click(),
    ]);

    // The wizard MUST land on step 1 (Connect & Pay). We assert via
    // the "Continue to review" button which is always rendered on
    // that step (the HL wallet input is hidden when pre-filled).
    await expect(
      page.locator('[data-testid="continue-to-review"]'),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /Choose your .* account size/i }),
    ).toHaveCount(0);
  });

  test("clicking the free pricing card lands directly on step 1", async ({
    page,
  }) => {
    const free = tiers.find((t) => Number(t.priceUsdc) === 0);
    test.skip(!free, "no free tier seeded");

    await page.goto("/pricing");
    const card = pricingCardByAccountSize(page, free.accountSize);
    const cta = card.locator('[data-testid="pricing-tier-cta"]');

    await Promise.all([
      page.waitForURL(
        new RegExp(`/register\\?.*tier=${free.accountSize}`),
        { timeout: 30_000, waitUntil: "commit" },
      ),
      cta.click(),
    ]);

    await expect(
      page.locator('[data-testid="continue-to-review"]'),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /Choose your .* account size/i }),
    ).toHaveCount(0);
  });
});
