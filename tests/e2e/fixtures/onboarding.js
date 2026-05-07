import { expect } from "@playwright/test";
import { E2E_MOCK_WALLET_ADDRESS } from "./wallet.js";

/**
 * Step 1 — visit `/register` (or a brand variant) and select the tier
 * matching `accountSize`. Returns the rendered tier card locator.
 *
 * Note: when navigating with `?tier=<accountSize>`, the wizard skips
 * step 0 entirely — see `gotoRegisterDeepLinked` below.
 */
export async function selectTier(page, { accountSize, registerPath = "/register" }) {
  await page.goto(registerPath);

  await expect(
    page.getByRole("heading", { name: /Choose your .* account size/i }),
  ).toBeVisible();

  const card = tierCardByAccountSize(page, accountSize);
  await expect(
    card,
    `expected a tier card for accountSize=${accountSize}`,
  ).toBeVisible();

  await card.click();

  // Use the bottom "Continue" button (`select-tier-continue`), not
  // the inline `tier-card-continue` div inside the card. The wizard
  // nests a `<div role="button">` inside the outer `<button>` for the
  // inline CTA — invalid HTML that Playwright clicks unreliably. The
  // bottom button is a sibling, plain `<button>`.
  await page.locator('[data-testid="select-tier-continue"]').click();

  // Step 1 (Connect & Pay) renders the "Continue to review" button at
  // the bottom of the form. We use that as the "we landed" signal
  // rather than `#hl-wallet` because the input may be hidden when the
  // wizard pre-fills the HL address from the connected wallet (a
  // "Change" button is rendered in display mode instead).
  await expect(
    page.locator('[data-testid="continue-to-review"]'),
  ).toBeVisible({ timeout: 15_000 });

  return card;
}

/**
 * Skip step 0 by deep-linking with `?tier=<accountSize>`. Mirrors the
 * deep-link flow from `/pricing` tier card clicks. Asserts that step 0
 * never renders (no flash of the "Choose your … account size" heading).
 */
export async function gotoRegisterDeepLinked(
  page,
  { accountSize, registerPath = "/register" },
) {
  await page.goto(`${registerPath}?tier=${accountSize}`);

  // Step 1 (Connect & Pay) renders the "Continue to review" button.
  // See comment in `selectTier` for why this is more reliable than
  // `#hl-wallet`.
  await expect(
    page.locator('[data-testid="continue-to-review"]'),
  ).toBeVisible({ timeout: 15_000 });

  // Strong negative signal: the step-0 heading must never appear.
  await expect(
    page.getByRole("heading", { name: /Choose your .* account size/i }),
  ).toHaveCount(0);
}

/**
 * Walk the registration wizard from step 1 (Connect & Pay) through
 * step 2 (Confirm) so the caller can submit the free-tier signup or
 * trigger preflight validation.
 *
 * Sequence:
 *   1. Type the HL address into `#hl-wallet` (step 1).
 *   2. Click "Continue to review" → wizard advances to step 2 with
 *      the review card and the `confirm-details` checkbox.
 *   3. Tick the checkbox so the Sign Up / Pay button unlocks.
 *
 * Defaults to the mocked connected wallet so ownership matches and
 * the form unlocks. Pass a different address to deliberately trigger
 * the wallet-ownership guard.
 */
export async function fillHlAddressAndConfirm(
  page,
  hlAddress = E2E_MOCK_WALLET_ADDRESS,
) {
  // The wizard pre-fills the HL wallet from the connected wallet on
  // step 1. When the pre-filled address is valid, the input is hidden
  // and a "Change" button is shown instead. Click "Change" to switch
  // to edit mode so we can type the address explicitly — this also
  // exercises the same code path real users hit when they want to
  // override the suggested wallet.
  const changeBtn = page.locator('[data-testid="hl-wallet-change"]');
  if (await changeBtn.isVisible().catch(() => false)) {
    await changeBtn.click();
  }

  const input = page.locator("#hl-wallet");
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill(hlAddress);
  // Trigger blur so the wizard accepts the value.
  await input.evaluate((el) => el.blur());

  // Step 1 → Step 2. The button is gated on `canContinueToConfirm`
  // (HL valid + wallet matches + payment method picked when paid).
  // For the free flow it unlocks once HL + ownership are good.
  const continueBtn = page.locator('[data-testid="continue-to-review"]');
  await expect(continueBtn).toBeVisible({ timeout: 15_000 });
  await expect(continueBtn).toBeEnabled({ timeout: 15_000 });
  await continueBtn.click();

  // Step 2: confirm-details checkbox renders once we're on the
  // review screen.
  const confirmCheckbox = page.locator('[data-testid="confirm-details"]');
  await expect(confirmCheckbox).toBeVisible({ timeout: 15_000 });
  await confirmCheckbox.click();
  // The checkbox is a native <input type="checkbox"> in this wizard,
  // so we assert via the `checked` property rather than a Radix
  // `data-state` attribute.
  await expect(confirmCheckbox).toBeChecked();
}

/**
 * Click the free-tier "Sign Up" button and wait for the wizard to land
 * on the Confirmation / Done step.
 */
export async function submitFreeSignup(page) {
  const btn = page.locator('[data-testid="free-signup"]');
  await expect(btn).toBeEnabled({ timeout: 15_000 });
  await btn.click();

  // The post-success step shows the Confirmation screen / "Done" stepper
  // state. Wait for any signal that the API call returned successfully.
  await expect(
    page.getByText(/registration|provisioning|confirmation|account/i).first(),
  ).toBeVisible({ timeout: 30_000 });
}

/**
 * Stable locator for the step-0 tier cards. Matches by the
 * `data-tier-account-size` attribute set on each `<button role="radio">`
 * in `<StepSelectTier>`.
 */
export function tierCardByAccountSize(page, accountSize) {
  return page
    .locator(`[data-testid="tier-card"][data-tier-account-size="${accountSize}"]`)
    .first();
}

/**
 * Stable locator for the marketing pricing cards on `/pricing` and
 * brand `/<brand>/pricing` pages.
 */
export function pricingCardByAccountSize(page, accountSize) {
  return page
    .locator(`[data-testid="pricing-tier-card"][data-tier-account-size="${accountSize}"]`)
    .first();
}
