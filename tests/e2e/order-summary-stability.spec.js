import { test, expect } from "@playwright/test";
import {
  closePool,
  deleteCouponByCode,
  loadActiveTiersBySlug,
  purgeWallet,
  upsertCoupon,
} from "./fixtures/db.js";
import { E2E_MOCK_WALLET_ADDRESS } from "./fixtures/wallet.js";

/**
 * Regression coverage for the order-summary flicker fix on
 * `<StepConnectAndPay>`.
 *
 * Bug: any change to `email` / `hlWallet` / `address` / `emailReady` /
 * `hlWalletValid` re-fired the validate-coupon useEffect, which set
 * `couponPricing` to `{ loading: true }` for ~450 ms+. While loading the
 * derived `showPromoDiscountLine` and `isFree` flags both became false, so
 * the "Promo (CODE) −$29" line and "Free" total flashed off, then back on
 * once the request resolved. End user perception: the entire form flickered
 * on every keystroke.
 *
 * Fix:
 *   - Decoupled `couponLoading` from `couponPricing` so the cached pricing
 *     persists across re-validations.
 *   - Stamped the validated code on `couponPricing.validatedFor` and made
 *     `lastGoodCouponPricing` derive from a confirmed `ok: true`.
 *   - Order summary fields (`price`, `challengeFeeBasisUsd`,
 *     `showPromoDiscountLine`, `promoDiscountUsd`) read from
 *     `lastGoodCouponPricing`, so they stay frozen on the previous good
 *     answer while a new request is in flight.
 *
 * This test pins that contract end-to-end:
 *   1. Land on step 1 with `?promo=<100% off>` deep-linked to a $29 tier.
 *   2. Wait for the discount line + "Free" total to render.
 *   3. Edit the email field repeatedly while a `MutationObserver` records
 *      every text update on `[data-testid="order-total"]`.
 *   4. Assert that the recorded text never contains a non-Free value
 *      (e.g. "$29 USDC") — i.e. the total never flips back to the list
 *      price during re-validation.
 */

const COUPON_CODE = "HS-E2E-FREE";
const PAID_TIER_ACCOUNT_SIZE = 5000;
const TIER_LIST_PRICE_USDC = 29; // matches `lib/db/seed.mjs` for vanta:5000

test.describe("Order summary stability with applied coupon", () => {
  let paidTier;

  test.beforeAll(async () => {
    const tiers = await loadActiveTiersBySlug("vanta");
    paidTier = tiers.find(
      (t) => Number(t.accountSize) === PAID_TIER_ACCOUNT_SIZE,
    );
    expect(
      paidTier,
      `no $${TIER_LIST_PRICE_USDC} 5K tier seeded for vanta; run \`pnpm db:seed\``,
    ).toBeTruthy();
    expect(
      Number(paidTier.priceUsdc),
      "the 5K vanta tier should be priced (>0) so the discount actually fires",
    ).toBeGreaterThan(0);

    await upsertCoupon({
      code: COUPON_CODE,
      discountType: "percent",
      discountValue: "100",
      useType: "multi_use",
    });
  });

  test.afterAll(async () => {
    await deleteCouponByCode(COUPON_CODE);
    await closePool();
  });

  test.beforeEach(async () => {
    // Make sure no prior registration row blocks the wizard rendering.
    await purgeWallet(E2E_MOCK_WALLET_ADDRESS);
  });

  test("the Total stays 'Free' (no flicker to '$29') while editing the email", async ({
    page,
  }) => {
    // Deep-link directly into step 1 with the prefilled promo. The
    // wizard reads both `?tier=` and `?promo=` from the URL.
    await page.goto(
      `/register?tier=${PAID_TIER_ACCOUNT_SIZE}&promo=${COUPON_CODE}`,
    );

    // Wait for step 1 (Connect & Pay) to render.
    await expect(
      page.locator('[data-testid="continue-to-review"]'),
    ).toBeVisible({ timeout: 15_000 });

    const orderTotal = page.locator('[data-testid="order-total"]');
    await expect(orderTotal).toBeVisible({ timeout: 15_000 });

    // Wait for the validate-coupon round trip to settle and the order
    // summary to flip to "Free". This happens asynchronously after the
    // `?promo=` prefill triggers /api/register/validate-coupon.
    await expect(orderTotal).toHaveText("Free", { timeout: 15_000 });
    await expect(page.locator('[data-testid="order-promo-line"]')).toBeVisible();

    // Install a MutationObserver on the Total node to record every text
    // value it takes during the next 2 seconds, then trigger several
    // email edits. If the bug regresses, we'll see the text flip from
    // "Free" → "$29 USDC" → "Free".
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="order-total"]');
      if (!el) return;
      window.__totalSnapshots = [el.textContent ?? ""];
      const mo = new MutationObserver(() => {
        window.__totalSnapshots.push(el.textContent ?? "");
      });
      mo.observe(el, {
        characterData: true,
        childList: true,
        subtree: true,
      });
      window.__totalObserver = mo;
    });

    const emailInput = page.locator('[data-testid="reg-email"]');
    await emailInput.waitFor({ state: "attached", timeout: 15_000 });

    // Hammer the email input the way a real user types, including the
    // "Change-button"-style burst that previously triggered the worst
    // flicker. The validate-coupon effect is debounced by 450ms, so we
    // need ~1.5s of activity to span a complete debounce + fetch cycle.
    const sequence = [
      "u",
      "us",
      "user",
      "user@",
      "user@example",
      "user@example.com",
      "user@example.co",
      "user@example.com",
    ];
    for (const value of sequence) {
      await emailInput.fill(value, { force: true });
      await page.waitForTimeout(120);
    }

    // Allow the debounced fetch + state updates to settle.
    await page.waitForTimeout(1500);

    const snapshots = await page.evaluate(() => {
      window.__totalObserver?.disconnect?.();
      return window.__totalSnapshots ?? [];
    });

    // Final state should still be "Free".
    await expect(orderTotal).toHaveText("Free");

    // Across the entire window, the Total must NEVER have flipped back
    // to a dollar value. The flicker bug rendered "$29 USDC" (or the
    // raw "$29 USDC " composed text) during the in-flight re-validation;
    // assert that no snapshot contains a "$" sign.
    const flickered = snapshots.filter((t) => t.includes("$"));
    expect(
      flickered,
      `Order Total flickered to a non-Free value during re-validation. Snapshots: ${JSON.stringify(snapshots)}`,
    ).toEqual([]);

    // Promo discount line stays visible too.
    await expect(
      page.locator('[data-testid="order-promo-line"]'),
    ).toBeVisible();
  });
});
