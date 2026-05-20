/**
 * Business-logic tests for `app/api/register/route.js` — the bits NOT
 * covered by `api-register-ownership-gate.test.js`:
 *
 *   - Free flow + miner failure → 502, no `pending` DB row inserted
 *     (regression of the prior "create pending then time out" bug
 *     where the UI happily said "You're registered" after a 504).
 *   - Free flow + miner reports "already registered" → 409
 *     (regression of the prior silent-success behavior).
 *   - Successful registration captures the miner response body into
 *     `registrations.metadata` so support / audit doesn't need a
 *     follow-up validator round-trip.
 *
 * The ownership signature gate is mocked open here so we're isolated
 * to post-gate behavior. Same mock topology as the ownership test for
 * consistency.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  TIERS: [{ accountSize: 1000, label: "$1K" }],
}));

const dbInsertMock = vi.fn().mockResolvedValue(undefined);
const dbSelectMock = vi.fn();
// Promise-like that also exposes .returning() / .onConflictDoNothing() so the
// real route — which now chains those methods for registration_id capture
// and first-touch attribution upserts — can be exercised by these tests.
function makeInsertChain(insertResult) {
  const chain = Promise.resolve(insertResult);
  chain.returning = () => Promise.resolve([{ id: 1 }]);
  chain.onConflictDoNothing = () => makeInsertChain(insertResult);
  return chain;
}
vi.mock("@/lib/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => dbSelectMock(),
        }),
        leftJoin: () => ({
          where: () => ({ limit: () => dbSelectMock() }),
        }),
      }),
    }),
    insert: () => ({
      values: (...args) => makeInsertChain(dbInsertMock(...args)),
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  }),
}));
vi.mock("@/lib/db/schema", () => ({
  users: { id: "users.id" },
  registrations: { id: "registrations.id" },
  affiliates: { id: "affiliates.id", useCount: "affiliates.useCount" },
  entityMiners: { hotkey: "entity_miners.hotkey", slug: "entity_miners.slug" },
  referralAttributions: {
    id: "referral_attributions.id",
    userId: "referral_attributions.user_id",
  },
  registrationAttributions: {
    id: "registration_attributions.id",
    registrationId: "registration_attributions.registration_id",
  },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@/lib/validator", () => ({
  checkValidatorStatus: vi.fn().mockResolvedValue({ status: "not_found" }),
  isConfirmedDeregistered: () => false,
}));
vi.mock("@/lib/dev-test", () => ({
  isAnyDevTestWallet: () => false,
  DEV_TEST_PRICE: 0,
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

const { POST } = await import("@/app/api/register/route.js");

const HL_ADDRESS = "0x1111111111111111111111111111111111111111";
const MINER_API_URL = "http://miner.example/";

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

function freeBody() {
  return {
    minerSlug: "vanta",
    hlAddress: HL_ADDRESS,
    accountSize: 1000,
    tierIndex: 0,
    paymentMethod: "free",
    email: "user@example.com",
  };
}

function signedHeaders() {
  return {
    "x-wallet": HL_ADDRESS,
    "x-signature": "0xsig",
    "x-nonce": String(Date.now()),
  };
}

beforeEach(() => {
  // Ownership gate is open in these tests — the signing wallet matches
  // the typed HL address.
  verifyHeadersMock.mockReset();
  verifyHeadersMock.mockResolvedValue({ wallet: HL_ADDRESS });

  dbInsertMock.mockReset();
  dbInsertMock.mockResolvedValue(undefined);
  dbSelectMock.mockReset();
  dbSelectMock.mockResolvedValue([]);

  minerMock.mockReset();
  minerMock.mockResolvedValue({
    slug: "vanta",
    hotkey: "hk",
    apiUrl: MINER_API_URL,
    apiKey: "test-key",
    usdcWallet: "0x9999999999999999999999999999999999999999",
  });
  tiersMock.mockReset();
  tiersMock.mockResolvedValue([
    { accountSize: 1000, priceUsdc: "0", isActive: true },
  ]);

  // The route uses the global `fetch` to call the miner's
  // /api/create-hl-subaccount endpoint. Default to a generic 200 here;
  // individual tests override.
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

describe("POST /api/register — free flow strict failure", () => {
  it("returns 502 and writes NO `pending` row when miner times out (504)", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("Gateway Timeout", { status: 504 }),
    );

    const res = await POST(
      makeRequest({ body: freeBody(), headers: signedHeaders() }),
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("Registration failed");
    // Critical regression guard: free flows MUST NOT leave a `pending`
    // row behind on miner failure (the UI used to render that as
    // "You're registered").
    const insertedRegistrations = dbInsertMock.mock.calls.filter((args) => {
      const value = args[0];
      // The route inserts a users row first; we only care about the
      // registrations insert. Identify it by the registration-shaped
      // payload (has `minerHotkey` / `hlAddress`).
      return value && (value.minerHotkey || value.hlAddress);
    });
    expect(insertedRegistrations.length).toBe(0);
  });

  it("returns 502 and writes NO `pending` row when miner is unreachable", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });

    const res = await POST(
      makeRequest({ body: freeBody(), headers: signedHeaders() }),
    );

    expect(res.status).toBe(502);
    const insertedRegistrations = dbInsertMock.mock.calls.filter(
      (args) => args[0]?.minerHotkey,
    );
    expect(insertedRegistrations.length).toBe(0);
  });

  it("returns 409 when miner reports the address is already registered", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ error: "already registered to subaccount xyz" }),
        { status: 400 },
      ),
    );

    const res = await POST(
      makeRequest({ body: freeBody(), headers: signedHeaders() }),
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already registered/i);
    const insertedRegistrations = dbInsertMock.mock.calls.filter(
      (args) => args[0]?.minerHotkey,
    );
    expect(insertedRegistrations.length).toBe(0);
  });
});

describe("POST /api/register — successful free registration captures miner metadata", () => {
  it("stores the miner response body in registrations.metadata", async () => {
    const minerPayload = {
      subaccount_uuid: "sub-abc-123",
      synthetic_hotkey: "5HW…",
      hl_address: HL_ADDRESS,
      account_size: 1000,
      created_at: "2026-05-06T00:00:00Z",
    };
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify(minerPayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const res = await POST(
      makeRequest({ body: freeBody(), headers: signedHeaders() }),
    );

    expect(res.status).toBe(200);

    // Find the registrations insert (not the users insert).
    const registrationInsert = dbInsertMock.mock.calls.find(
      (args) => args[0]?.minerHotkey,
    );
    expect(registrationInsert).toBeDefined();
    const row = registrationInsert[0];
    expect(row.status).toBe("registered");
    expect(row.metadata).toEqual(minerPayload);
  });
});

describe("POST /api/register — email required", () => {
  it("rejects with 400 + EMAIL_REQUIRED when email is missing", async () => {
    const body = { ...freeBody() };
    delete body.email;

    const res = await POST(
      makeRequest({ body, headers: signedHeaders() }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("EMAIL_REQUIRED");
    expect(json.error).toMatch(/email/i);
  });

  it("rejects with 400 when email is malformed", async () => {
    const res = await POST(
      makeRequest({
        body: { ...freeBody(), email: "not-an-email" },
        headers: signedHeaders(),
      }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid email/i);
  });
});
