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
//   1. The "Start Challenge" CTA in the nav must hide when the
//      connected wallet has an active registration. Otherwise we
//      invite users who already paid to pay again.
//   2. The KYC "Identity Verification Required" card must NOT render
//      for non-owners (anyone viewing a dashboard for an HL address
//      that isn't their connected wallet). Privacy + UX guard.
//
// `NavStartChallengeCta` queries `/api/registration-status` to decide
// whether to hide. That endpoint does NOT consult the local DB — it
// proxies the validator. Because we blank `VALIDATOR_API_URL` for
// e2e, the endpoint would always 500 and the CTA would never hide.
// We stub the route per-test with `page.route()` to surface the
// "active" / "none" decision the UI makes from the validator's reply.

test.describe("Dashboard nav (mocked wallet)", () => {
  let paidTier;

  test.beforeAll(async () => {
    const tiers = await loadActiveTiersBySlug("vanta");
    paidTier =
      tiers.find((t) => Number(t.priceUsdc) > 0 && t.accountSize > 0) ??
      tiers[0];
    expect(paidTier).toBeTruthy();
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

  test('"Start Challenge" CTA hides when the connected wallet has an active registration', async ({
    page,
  }) => {
    // Phase 1: validator says "none" → CTA visible.
    await page.route("**/api/registration-status*", async (route) => {
      const url = new URL(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "none",
          hl_address: url.searchParams.get("hl_address"),
        }),
      });
    });

    await page.goto("/dashboard");
    // The dashboard layout passes `walletAware` to `<Nav />`, which
    // renders `<NavStartChallengeCta />` with the data-testid.
    await expect(
      page.locator('[data-testid="nav-start-challenge-cta"]'),
    ).toBeVisible({ timeout: 15_000 });

    // Seed an active registration so the persisted state matches
    // what the (mocked) validator response will claim.
    await seedRegistration({
      hlAddress: E2E_MOCK_WALLET_ADDRESS,
      status: "registered",
      accountSize: paidTier.accountSize,
      tierIndex: 0,
      priceUsdc: paidTier.priceUsdc,
      txHash: `0xseed${Date.now().toString(16)}`,
    });

    // Phase 2: validator now says "active" → CTA must hide.
    await page.unroute("**/api/registration-status*");
    await page.route("**/api/registration-status*", async (route) => {
      const url = new URL(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "active",
          hl_address: url.searchParams.get("hl_address"),
        }),
      });
    });

    await page.reload();
    await expect(
      page.locator('[data-testid="nav-start-challenge-cta"]'),
    ).toHaveCount(0, { timeout: 15_000 });
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

    await page.goto(`/dashboard?addr=${E2E_OTHER_WALLET_ADDRESS}`);

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
