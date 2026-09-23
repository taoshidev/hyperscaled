import { test, expect } from "@playwright/test";
import {
  closePool,
  loadActiveTiersBySlug,
  purgeWallet,
  seedRegistration,
} from "./fixtures/db.js";
import {
  E2E_MOCK_WALLET_ADDRESS,
  E2E_OTHER_WALLET_ADDRESS,
} from "./fixtures/wallet.js";

// Dashboard chrome regressions:
//   1. Registrations are closed (Notion #1560): the nav CTA is the
//      Vanta Trading link, never a path back into /register.
//   2. The KYC "Identity Verification Required" card must NOT render
//      for non-owners (anyone viewing a dashboard for an HL address
//      that isn't their connected wallet). Privacy + UX guard.

test.describe("Dashboard nav (mocked wallet)", () => {
  let paidTier;

  test.beforeAll(async ({ browser }) => {
    const tiers = await loadActiveTiersBySlug("vanta");
    paidTier =
      tiers.find((t) => Number(t.priceUsdc) > 0 && t.accountSize > 0) ??
      tiers[0];
    expect(paidTier).toBeTruthy();

    const warmCtx = await browser.newContext();
    const warmPage = await warmCtx.newPage();
    try {
      await warmPage.goto("/dashboard", {
        waitUntil: "domcontentloaded",
        timeout: 180_000,
      });
    } catch {
      /* the per-test goto will surface any real failure */
    } finally {
      await warmCtx.close();
    }
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

  test("nav CTA sends traders to Vanta Trading (registrations closed, Notion #1560)", async ({
    page,
  }) => {
    await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    const cta = page.locator('[data-testid="nav-vanta-trading-cta"]');
    await expect(cta).toBeVisible({ timeout: 15_000 });
    await expect(cta).toHaveText("Go to Vanta Trading");
    await expect(cta).toHaveAttribute("href", /^https:\/\/vantatrading\.io\/?$/);
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(page.locator('a[href*="/register"]')).toHaveCount(0);
  });

  test("KYC verification card is absent on a dashboard the connected wallet does not own", async ({
    page,
  }) => {
    // Seed an active registration for a *different* wallet, then view
    // its dashboard via the `?addr=` lookup. The connected (mocked)
    // wallet is NOT the HL address — so KYC card must not render.
    await seedRegistration({
      hlAddress: E2E_OTHER_WALLET_ADDRESS,
      status: "registered",
      accountSize: paidTier.accountSize,
      tierIndex: 0,
      priceUsdc: paidTier.priceUsdc,
      txHash: `0xseed${Date.now().toString(16)}`,
    });

    await page.goto(`/dashboard?addr=${E2E_OTHER_WALLET_ADDRESS}`, {
      timeout: 120_000,
    });

    // The KYC card rendered for non-owners would surface either the
    // "Identity Verification Required for Payouts" copy (status === "none")
    // or the "Verification Not Approved" copy (status === "rejected").
    // Both are gated on `isAuthorized` for non-owners — assert neither
    // appears.
    await expect(
      page.getByText("Identity Verification Required for Payouts"),
    ).toHaveCount(0);
    await expect(
      page.getByText("Verification Not Approved"),
    ).toHaveCount(0);
  });
});
