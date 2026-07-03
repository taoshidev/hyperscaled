import crypto from "node:crypto";
import { test, expect } from "@playwright/test";
import { closePool, getUserKyc, purgeWallet, seedUser } from "./fixtures/db.js";
import { E2E_SUMSUB_WEBHOOK_SECRET } from "./fixtures/wallet.js";

// End-to-end coverage for the SumSub → /api/kyc/webhook path. Unlike the unit
// tests (which mock the DB), this drives the real route + real Postgres so we
// prove the review result actually lands on the users row. This is the exact
// path that silently failed in prod ("Verification In Progress" forever).
//
// The webhook is a server-to-server POST, so there's no page to drive — we use
// Playwright's `request` fixture against the spawned dev server. The dev server
// is booted with SUMSUB_WEBHOOK_SECRET = E2E_SUMSUB_WEBHOOK_SECRET (see
// playwright.config.js), so we can forge valid HMAC signatures here.

// Deterministic wallet applicant (0x…, 40 hex chars) owned by "us".
const WALLET = "0x0dab1e5e0000000000000000000000000000abcd";
// A sibling-app applicant id (UUID) that also arrives on the shared SumSub
// project. Must be ignored, never written as a wallet.
const FOREIGN_UUID = "c04febbb-d494-4bc3-af0f-b0480a5a23e4";

const ALG_MAP = {
  HMAC_SHA1_HEX: "sha1",
  HMAC_SHA256_HEX: "sha256",
  HMAC_SHA512_HEX: "sha512",
};

function postWebhook(
  request,
  payload,
  { secret = E2E_SUMSUB_WEBHOOK_SECRET, alg = "HMAC_SHA256_HEX" } = {},
) {
  const raw = JSON.stringify(payload);
  const digest = crypto
    .createHmac(ALG_MAP[alg], secret)
    .update(raw)
    .digest("hex");
  return request.post("/api/kyc/webhook", {
    headers: {
      "content-type": "application/json",
      "x-payload-digest": digest,
      "x-payload-digest-alg": alg,
    },
    data: raw,
  });
}

test.describe("SumSub KYC webhook (real DB)", () => {
  test.beforeEach(async () => {
    await purgeWallet(WALLET);
  });

  test.afterAll(async () => {
    await purgeWallet(WALLET);
    await closePool();
  });

  test("approves a wallet applicant on a GREEN review", async ({ request }) => {
    await seedUser({ wallet: WALLET, kycStatus: "pending" });

    const res = await postWebhook(request, {
      type: "applicantReviewed",
      externalUserId: WALLET,
      reviewResult: { reviewAnswer: "GREEN" },
    });
    expect(res.status()).toBe(200);

    const user = await getUserKyc(WALLET);
    expect(user.kycStatus).toBe("approved");
    expect(user.kycVerifiedAt).not.toBeNull();
  });

  test("rejects a wallet applicant on a RED review", async ({ request }) => {
    await seedUser({ wallet: WALLET, kycStatus: "pending" });

    const res = await postWebhook(request, {
      type: "applicantReviewed",
      externalUserId: WALLET,
      reviewResult: { reviewAnswer: "RED", reviewRejectType: "FINAL" },
    });
    expect(res.status()).toBe(200);

    const user = await getUserKyc(WALLET);
    expect(user.kycStatus).toBe("rejected");
  });

  test("ignores a cross-app UUID event and leaves our wallet row untouched", async ({
    request,
  }) => {
    // Regression: a UUID externalUserId from vanta-ui / hyperscaled-api must
    // never be treated as a wallet. The seeded wallet must stay `pending`.
    await seedUser({ wallet: WALLET, kycStatus: "pending" });

    const res = await postWebhook(request, {
      type: "applicantReviewed",
      externalUserId: FOREIGN_UUID,
      reviewResult: { reviewAnswer: "GREEN" },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true, ignored: true });

    const user = await getUserKyc(WALLET);
    expect(user.kycStatus).toBe("pending");
  });

  test("rejects an invalid signature with 403 and does not mutate the row", async ({
    request,
  }) => {
    await seedUser({ wallet: WALLET, kycStatus: "pending" });

    const res = await postWebhook(
      request,
      {
        type: "applicantReviewed",
        externalUserId: WALLET,
        reviewResult: { reviewAnswer: "GREEN" },
      },
      { secret: "the-wrong-secret" },
    );
    expect(res.status()).toBe(403);

    const user = await getUserKyc(WALLET);
    expect(user.kycStatus).toBe("pending");
  });
});
