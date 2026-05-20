import { test, expect } from "@playwright/test";
import {
  closePool,
  getLatestRegistrationFor,
  loadActiveTiersBySlug,
  purgeWallet,
  seedRegistration,
} from "./fixtures/db.js";
import {
  fillHlAddressAndConfirm,
  selectTier,
  submitFreeSignup,
} from "./fixtures/onboarding.js";
import { E2E_MOCK_WALLET_ADDRESS } from "./fixtures/wallet.js";

// Free-tier flow: a stale `pending` row from an earlier failed attempt
// should be reconciled (marked `failed`) and a fresh `registered` row
// inserted. Without that path the user is permanently stuck.
//
// This test runs against the suppressed-validator path — when
// VALIDATOR_API_URL is blank, `isConfirmedDeregistered` returns true
// (no active subaccount on the validator), so the stale row qualifies
// for reconciliation.

test.describe("Stale pending reconciliation (free tier)", () => {
  let freeTier;

  test.beforeAll(async () => {
    const tiers = await loadActiveTiersBySlug("vanta");
    freeTier = tiers.find((t) => Number(t.priceUsdc) === 0);
    expect(
      freeTier,
      "no free tier ($0) seeded for vanta; run `pnpm db:seed`",
    ).toBeTruthy();
  });

  test.beforeEach(async () => {
    await purgeWallet(E2E_MOCK_WALLET_ADDRESS);
  });

  test.afterAll(async () => {
    await purgeWallet(E2E_MOCK_WALLET_ADDRESS);
    await closePool();
  });

  test("a stale pending row reconciles and a new registration succeeds", async ({
    page,
  }) => {
    const stalePendingId = await seedRegistration({
      hlAddress: E2E_MOCK_WALLET_ADDRESS,
      status: "pending",
      accountSize: freeTier.accountSize,
      tierIndex: 0,
      priceUsdc: "0.00",
    });

    await selectTier(page, { accountSize: freeTier.accountSize });

    await fillHlAddressAndConfirm(page, E2E_MOCK_WALLET_ADDRESS);

    await submitFreeSignup(page);

    // The latest row should now be a fresh `registered` row whose id
    // is greater than the stale row we seeded — proving a NEW row was
    // inserted, not the stale one updated.
    const row = await waitForRegisteredRowAfter(
      E2E_MOCK_WALLET_ADDRESS,
      stalePendingId,
    );
    expect(row, "expected a fresh registered row to be inserted").toBeTruthy();
    expect(row.status).toBe("registered");
    expect(row.id).toBeGreaterThan(stalePendingId);
  });
});

async function waitForRegisteredRowAfter(
  hlAddress,
  afterId,
  { timeoutMs = 15_000 } = {},
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = await getLatestRegistrationFor(hlAddress);
    if (row && row.id > afterId && row.status === "registered") return row;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}
