import { test, expect } from "@playwright/test";

// Registrations are closed on every brand (Notion #1560), so each tenant's
// /<brand>/register route renders the closure notice instead of the wizard.
// Still asserts the brand chrome the wizard used to own: the Exit button
// targets the in-app tenant home (not /), and the logo links to the external
// brand site (not the wrong domain).

const BRANDS = [
  {
    slug: "beanstock",
    expectedExitHref: "/beanstock",
    expectedLogoHref: "https://beanstocktrading.com",
  },
  {
    slug: "bitcast",
    expectedExitHref: "/bitcast",
    expectedLogoHref: "https://hyperstack.trade",
  },
  {
    slug: "lunarcrush",
    expectedExitHref: "/lunarcrush",
    expectedLogoHref: "https://lunarcrush.com",
  },
];

test.describe("Tenant brand register routes", () => {
  for (const brand of BRANDS) {
    test(`/${brand.slug}/register shows the closure notice with correct exit and logo`, async ({
      page,
    }) => {
      await page.goto(`/${brand.slug}/register`);

      await expect(
        page.getByRole("heading", { name: "Hyperscaled is no longer accepting new accounts" }),
      ).toBeVisible();
      await expect(page.locator('[data-testid="registration-closed-cta"]')).toHaveAttribute(
        "href",
        /^https:\/\/vantatrading\.io\/?$/,
      );

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
