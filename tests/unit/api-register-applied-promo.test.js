/**
 * Regression coverage for the conversion-ledger fix in `/api/register`.
 *
 * Before the fix, when a user landed with `?promo=SUMMER25` (a stale or
 * marketing-only string) and later applied a real coupon code at checkout,
 * the per-user `referral_attributions.promoCode` and per-conversion
 * `registration_attributions.promoCode` rows recorded the COOKIE's `?promo=`
 * string, not the coupon that actually granted the discount. The Conversion
 * Ledger in `/command-center/attributions` then showed the wrong code.
 *
 * The fix records `couponMeta.code` (the canonical DB-stored code from the
 * coupons table) on both attribution rows. This test pins that contract:
 *
 *   - Cookie carries `promo: "COOKIE-PROMO-VAL"`
 *   - User submits with `couponCode: "APPLIED-CODE-XYZ"` and that coupon
 *     applies a 100% discount → free path
 *   - Both inserted attribution rows have `promoCode: "APPLIED-CODE-XYZ"`,
 *     NOT "COOKIE-PROMO-VAL"
 *
 * The companion test "no coupon applied → null promoCode (not the cookie's
 * raw string)" guards against re-introducing the original bug for the case
 * where the user ignores the prefilled promo.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks for unrelated route dependencies (mirrors api-register-business.test.js) ─
const verifyHeadersMock = vi.fn();
vi.mock("@/lib/wallet-auth.js", () => ({
  verifyWalletHeaders: (...args) => verifyHeadersMock(...args),
  verifyWalletSignature: vi.fn(),
  buildSignedMessage: vi.fn(),
}));

vi.mock("@/lib/errors", () => ({
  reportError: vi.fn(),
  reportCritical: vi.fn(),
  flushErrors: vi.fn().mockResolvedValue(undefined),
  SEVERITY: { ERROR: "error", WARNING: "warning" },
}));

const minerMock = vi.fn();
const tiersMock = vi.fn();
vi.mock("@/lib/miners", () => ({
  getMinerBySlug: (...args) => minerMock(...args),
  getTiersForMiner: (...args) => tiersMock(...args),
  TIERS: [{ accountSize: 5000, label: "$5K" }],
}));

vi.mock("@/lib/registration-capacity", () => ({
  checkRegistrationCap: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/validator", () => ({
  checkValidatorStatus: vi.fn().mockResolvedValue({ status: "not_found" }),
  isConfirmedDeregistered: () => false,
}));
vi.mock("@/lib/dev-test", () => ({
  isAnyDevTestWallet: () => false,
  DEV_TEST_PRICE: 1,
}));
vi.mock("@/lib/tolt", () => ({ trackConversion: vi.fn() }));
vi.mock("@/lib/parse-error-body", () => ({
  parseErrorBody: (s) => {
    if (s == null) return null;
    try {
      return JSON.parse(s);
    } catch {
      return s;
    }
  },
}));
vi.mock("@coinbase/x402", () => ({ facilitator: {} }));
vi.mock("@x402/core/server", () => ({ HTTPFacilitatorClient: class {} }));
vi.mock("@x402/core/http", () => ({
  encodePaymentRequiredHeader: () => "",
  decodePaymentSignatureHeader: () => ({}),
  encodePaymentResponseHeader: () => "",
}));

// ── Schema mocks: opaque objects we can compare by reference ──────────────
const usersTable = { id: "users.id", wallet: "users.wallet" };
const registrationsTable = {
  id: "registrations.id",
  status: "registrations.status",
  createdAt: "registrations.createdAt",
  priceUsdc: "registrations.priceUsdc",
  minerHotkey: "registrations.minerHotkey",
  hlAddress: "registrations.hlAddress",
  txHash: "registrations.txHash",
};
const affiliatesTable = {
  id: "affiliates.id",
  slug: "affiliates.slug",
  isActive: "affiliates.isActive",
  useCount: "affiliates.useCount",
};
const entityMinersTable = {
  hotkey: "entity_miners.hotkey",
  slug: "entity_miners.slug",
};
const referralAttributionsTable = {
  id: "referral_attributions.id",
  userId: "referral_attributions.user_id",
};
const registrationAttributionsTable = {
  id: "registration_attributions.id",
  registrationId: "registration_attributions.registration_id",
};

vi.mock("@/lib/db/schema", () => ({
  users: usersTable,
  registrations: registrationsTable,
  affiliates: affiliatesTable,
  entityMiners: entityMinersTable,
  referralAttributions: referralAttributionsTable,
  registrationAttributions: registrationAttributionsTable,
}));

// ── Cookie attribution mocks ─────────────────────────────────────────────
const cookieDecodedFn = vi.fn();
vi.mock("@/lib/auth/attribution-cookie", () => ({
  ATTRIBUTION_COOKIE: "hs_attr",
  verifyAttributionCookie: (raw) =>
    Promise.resolve(raw ? cookieDecodedFn(raw) : null),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name) =>
      name === "hs_attr"
        ? { value: "test-cookie-payload.test-cookie-sig" }
        : undefined,
  }),
}));

// ── Pricing mock: bypass the coupon DB lookups so we can drive couponMeta ─
const pricingMock = vi.fn();
vi.mock("@/lib/registration-pricing", () => ({
  evaluateRegistrationPricing: (...args) => pricingMock(...args),
  applyCouponToAmount: vi.fn(),
  recordRegistrationCouponRedemption: vi.fn().mockResolvedValue({ ok: true }),
}));

// ── DB mock: route SELECTs by table identity, capture INSERT payloads ────
/** All values the route calls `db.insert(table).values(...)` with, in order. */
const insertCalls = [];

function buildInsertChain() {
  // The route chains `.returning()` for users / registrations / referral
  // attribution row-ids, and `.onConflictDoNothing()` for the attribution
  // upserts. The chain is a thenable so callers can `await` it directly.
  // Both `.returning` and `.onConflictDoNothing` return a fresh chain so
  // we don't double-record the values payload in `insertCalls`.
  const chain = Promise.resolve(undefined);
  chain.returning = () => Promise.resolve([{ id: 1 }]);
  chain.onConflictDoNothing = () => buildInsertChain();
  return chain;
}

function makeInsertChain(table, values) {
  insertCalls.push({ table, values });
  return buildInsertChain();
}

vi.mock("@/lib/db", () => ({
  getDb: async () => ({
    select: (cols) => ({
      from: (table) => {
        const ctx = { table, cols };
        const where = () => ({
          limit: async () => routeSelect(ctx),
        });
        return {
          where,
          leftJoin: () => ({ where }),
        };
      },
    }),
    insert: (table) => ({
      values: (vals) => makeInsertChain(table, vals),
    }),
    update: () => ({
      set: () => ({ where: () => Promise.resolve() }),
    }),
  }),
}));

/**
 * Per-table SELECT routing. Every table the route reads in the free + coupon
 * path has a deterministic answer here:
 *   - affiliates  → cookie's affiliate slug resolves to id 42 (also used for
 *                   the legacy `users.affiliateId` lookup when the body
 *                   includes `affiliateUtm`).
 *   - entityMiners → cookie's tenant slug resolves to hotkey "hk-vanta".
 *   - registrations → no existing row (no duplicate, no txHash collision).
 *   - users → no existing row (we'll insert a fresh one).
 */
function routeSelect(ctx) {
  if (ctx.table === affiliatesTable) return [{ id: 42 }];
  if (ctx.table === entityMinersTable) return [{ hotkey: "hk-vanta" }];
  if (ctx.table === registrationsTable) return [];
  if (ctx.table === usersTable) return [];
  return [];
}

const { POST } = await import("@/app/api/register/route.js");

// ── Test inputs ──────────────────────────────────────────────────────────
const HL_ADDRESS = "0x1111111111111111111111111111111111111111";
const MINER_API_URL = "http://miner.example/";
const COOKIE_PROMO = "COOKIE-PROMO-VAL";
const APPLIED_COUPON = "APPLIED-CODE-XYZ";
const TIER_LIST_PRICE = 29;

function makeRequest({ body, headers = {} }) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    method: "POST",
    url: "http://localhost:4568/api/register",
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
    async text() {
      return text;
    },
    async json() {
      return JSON.parse(text);
    },
  };
}

function freeBody(overrides = {}) {
  return {
    minerSlug: "vanta",
    hlAddress: HL_ADDRESS,
    accountSize: 5000,
    tierIndex: 0,
    paymentMethod: "free",
    email: "user@example.com",
    ...overrides,
  };
}

function signedHeaders({ couponCode } = {}) {
  return {
    "x-wallet": HL_ADDRESS,
    "x-signature": "0xsig",
    "x-nonce": String(Date.now()),
    ...(couponCode ? { "x-coupon-code": couponCode } : {}),
  };
}

function pricingEvalWithCoupon(code) {
  return {
    ok: true,
    tierSlug: "vanta:5000",
    tierListPrice: TIER_LIST_PRICE,
    devTest: false,
    baseAfterDev: TIER_LIST_PRICE,
    couponMeta: {
      couponId: "coupon-uuid-abc",
      code,
      discountType: "percent",
      discountValue: 100,
    },
    discountAmount: TIER_LIST_PRICE,
    effectivePrice: 0,
  };
}

function pricingEvalWithoutCoupon() {
  return {
    ok: true,
    tierSlug: "vanta:5000",
    tierListPrice: 0, // free tier
    devTest: false,
    baseAfterDev: 0,
    couponMeta: null,
    discountAmount: 0,
    effectivePrice: 0,
  };
}

beforeEach(() => {
  insertCalls.length = 0;

  verifyHeadersMock.mockReset();
  verifyHeadersMock.mockResolvedValue({ wallet: HL_ADDRESS });

  minerMock.mockReset();
  minerMock.mockResolvedValue({
    slug: "vanta",
    hotkey: "hk-vanta",
    apiUrl: MINER_API_URL,
    apiKey: "test-key",
    usdcWallet: "0x9999999999999999999999999999999999999999",
  });
  tiersMock.mockReset();
  tiersMock.mockResolvedValue([
    { accountSize: 5000, priceUsdc: String(TIER_LIST_PRICE), isActive: true },
  ]);

  pricingMock.mockReset();

  cookieDecodedFn.mockReset();
  cookieDecodedFn.mockReturnValue({
    affiliate: "lunarcrush",
    tenant: "vanta",
    promo: COOKIE_PROMO,
    clickId: "11111111-1111-4111-8111-111111111111",
    firstTouchAt: Math.floor(Date.now() / 1000),
  });

  // Miner API stub — returns a clean success.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(
        JSON.stringify({ subaccount_uuid: "sub-123", hl_address: HL_ADDRESS }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/register — attribution rows record the applied coupon code", () => {
  it("records `couponMeta.code` (NOT the cookie's `?promo=` string) on referralAttributions and registrationAttributions", async () => {
    pricingMock.mockResolvedValue(pricingEvalWithCoupon(APPLIED_COUPON));

    const res = await POST(
      makeRequest({
        body: freeBody(),
        headers: signedHeaders({ couponCode: APPLIED_COUPON }),
      }),
    );

    expect(res.status).toBe(200);

    const referralRows = insertCalls.filter(
      (c) => c.table === referralAttributionsTable,
    );
    const registrationRows = insertCalls.filter(
      (c) => c.table === registrationAttributionsTable,
    );

    expect(
      referralRows.length,
      "expected exactly one referral_attributions insert",
    ).toBe(1);
    expect(
      registrationRows.length,
      "expected exactly one registration_attributions insert",
    ).toBe(1);

    // The fix: applied coupon code wins. The cookie's stale `promo` value
    // (COOKIE_PROMO) must NOT leak into either attribution row.
    expect(referralRows[0].values.promoCode).toBe(APPLIED_COUPON);
    expect(referralRows[0].values.promoCode).not.toBe(COOKIE_PROMO);

    expect(registrationRows[0].values.promoCode).toBe(APPLIED_COUPON);
    expect(registrationRows[0].values.promoCode).not.toBe(COOKIE_PROMO);

    // Sanity: affiliate / tenant still come from the cookie (last-touch).
    expect(referralRows[0].values.affiliateId).toBe(42);
    expect(referralRows[0].values.entityMinerHotkey).toBe("hk-vanta");
    expect(registrationRows[0].values.affiliateId).toBe(42);
    expect(registrationRows[0].values.entityMinerHotkey).toBe("hk-vanta");
    // Conversion ledger amount reflects the discounted (free) price.
    expect(registrationRows[0].values.amountUsdc).toBe("0");
  });

  it("records null promoCode (NOT the cookie's `?promo=` string) when no coupon was applied", async () => {
    pricingMock.mockResolvedValue(pricingEvalWithoutCoupon());

    const res = await POST(
      makeRequest({
        // Free tier with NO x-coupon-code header AND no body coupon — user
        // ignored / cleared the prefilled promo. Cookie still carries
        // `promo: COOKIE_PROMO`, but we must not record it as a redemption.
        body: freeBody(),
        headers: signedHeaders(),
      }),
    );

    expect(res.status).toBe(200);

    const referralRows = insertCalls.filter(
      (c) => c.table === referralAttributionsTable,
    );
    const registrationRows = insertCalls.filter(
      (c) => c.table === registrationAttributionsTable,
    );
    expect(referralRows).toHaveLength(1);
    expect(registrationRows).toHaveLength(1);

    expect(referralRows[0].values.promoCode).toBeNull();
    expect(referralRows[0].values.promoCode).not.toBe(COOKIE_PROMO);
    expect(registrationRows[0].values.promoCode).toBeNull();
    expect(registrationRows[0].values.promoCode).not.toBe(COOKIE_PROMO);
  });

  it("transition fallback: still applies the coupon when an older client sent it in the body and not in the header", async () => {
    // Pre-header-transport clients put `couponCode` in the JSON body. The
    // server keeps a body fallback so a brief client/server skew during
    // rollout doesn't silently drop discounts. This pins that fallback.
    pricingMock.mockResolvedValue(pricingEvalWithCoupon(APPLIED_COUPON));

    const res = await POST(
      makeRequest({
        body: freeBody({ couponCode: APPLIED_COUPON }),
        headers: signedHeaders(),
      }),
    );

    expect(res.status).toBe(200);

    const referralRows = insertCalls.filter(
      (c) => c.table === referralAttributionsTable,
    );
    const registrationRows = insertCalls.filter(
      (c) => c.table === registrationAttributionsTable,
    );
    expect(referralRows[0].values.promoCode).toBe(APPLIED_COUPON);
    expect(registrationRows[0].values.promoCode).toBe(APPLIED_COUPON);
  });
});
