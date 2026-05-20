import { test, expect } from "@playwright/test";
import {
  closePool,
  loadActiveTiersBySlug,
} from "./fixtures/db.js";
import { tierCardByAccountSize } from "./fixtures/onboarding.js";

// Asserts each tenant brand's /<brand>/register route renders its tier
// list (the bug we hit when the seed was missing the beanstock miner),
// the Exit button targets the in-app tenant home (not /), and the logo
// links to the external brand site (not the wrong domain).

// Each brand's `app/<slug>/register/page.jsx` may filter out some DB
// tiers before handing them to the wizard. `accountSizeFilter` reflects
// that — keep it in sync with the page's `dbTiers.filter(...)` call.
const BRANDS = [
  {
    slug: "beanstock",
    expectedExitHref: "/beanstock",
    expectedLogoHref: "https://beanstocktrading.com",
    // `app/beanstock/register/page.jsx` excludes the $1K free tier.
    accountSizeFilter: (size) => size > 1000,
  },
  {
    slug: "bitcast",
    expectedExitHref: "/bitcast",
    expectedLogoHref: "https://hyperfunded.co",
    accountSizeFilter: () => true,
  },
  {
    slug: "lunarcrush",
    expectedExitHref: "/lunarcrush",
    expectedLogoHref: "https://lunarcrush.com",
    accountSizeFilter: () => true,
  },
];

test.describe("Tenant brand register routes", () => {
  test.afterAll(async () => {
    await closePool();
  });

  for (const brand of BRANDS) {
    test(`/${brand.slug}/register renders tiers, exit, and logo correctly`, async ({
      page,
    }) => {
      const allTiers = await loadActiveTiersBySlug(brand.slug);
      const tiers = allTiers.filter((t) =>
        brand.accountSizeFilter(t.accountSize),
      );

      // If the brand isn't seeded yet (e.g. lunarcrush is in
      // `lib/brand.jsx` but not in `lib/db/seed.mjs`), skip with a
      // clear message rather than failing — that's a seed gap, not a
      // product regression.
      test.skip(
        tiers.length === 0,
        `no active tiers for slug=${brand.slug}; add it to lib/db/seed.mjs and re-seed`,
      );

      await page.goto(`/${brand.slug}/register`);

      await expect(
        page.getByRole("heading", { name: /Choose your .* account size/i }),
      ).toBeVisible();

      // Every tier the brand exposes must render in the wizard.
      for (const tier of tiers) {
        const card = tierCardByAccountSize(page, tier.accountSize);
        await expect(
          card,
          `expected wizard tier card for slug=${brand.slug} accountSize=${tier.accountSize}`,
        ).toBeVisible();
      }

      const exitLink = page.locator('[data-testid="register-exit-link"]');
      await expect(exitLink).toBeVisible();
      const exitHref = await exitLink.getAttribute("href");
      expect(
        exitHref,
        `Exit on /${brand.slug}/register must target the tenant home, not /`,
      ).toBe(brand.expectedExitHref);

      const logoLink = page.locator('[data-testid="register-logo-link"]');
      await expect(logoLink).toBeVisible();
      const logoHref = await logoLink.getAttribute("href");
      expect(
        logoHref,
        `Logo on /${brand.slug}/register must link to the canonical brand site`,
      ).toBe(brand.expectedLogoHref);
    });
  }
});
