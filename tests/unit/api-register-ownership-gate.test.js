import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the auth verifier so we control whether the gate "passes" or
// "fails" without needing a real wallet signature in tests. The
// ownership gate is what we're exercising here; downstream miner /
// payment / DB logic is already covered by other tests.
const verifyHeadersMock = vi.fn();
vi.mock("@/lib/wallet-auth.js", () => ({
  verifyWalletHeaders: (...args) => verifyHeadersMock(...args),
  // Re-export anything else the route file might pull from this module.
  verifyWalletSignature: vi.fn(),
  buildSignedMessage: vi.fn(),
}));

// Stub out everything else the register route imports so the module
// loads cleanly without DB / external connections.
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
vi.mock("@/lib/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => dbSelectMock(),
        }),
      }),
    }),
    insert: () => ({ values: (...args) => dbInsertMock(...args) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  }),
}));
vi.mock("@/lib/db/schema", () => ({
  users: {},
  registrations: {},
  affiliates: {},
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
vi.mock("@/lib/parse-error-body", () => ({ parseErrorBody: (s) => s }));
vi.mock("@coinbase/x402", () => ({ facilitator: {} }));
vi.mock("@x402/core/server", () => ({ HTTPFacilitatorClient: class {} }));
vi.mock("@x402/core/http", () => ({
  encodePaymentRequiredHeader: () => "",
  decodePaymentSignatureHeader: () => ({}),
  encodePaymentResponseHeader: () => "",
}));

const { POST } = await import("@/app/api/register/route.js");

const HL_ADDRESS = "0x1111111111111111111111111111111111111111";
const OTHER_WALLET = "0x2222222222222222222222222222222222222222";

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

beforeEach(() => {
  verifyHeadersMock.mockReset();
  // Default: mimic the real verifier's contract — throw when any of
  // the three required headers are missing. Individual tests can
  // override with mockResolvedValue / mockRejectedValue / mockImplementation.
  verifyHeadersMock.mockImplementation(({ headers }) => {
    if (!headers?.wallet || !headers?.signature || !headers?.nonce) {
      throw new Error(
        "Missing authentication headers (x-wallet, x-signature, x-nonce)",
      );
    }
    return { wallet: headers.wallet };
  });

  dbInsertMock.mockReset();
  dbInsertMock.mockResolvedValue(undefined);
  dbSelectMock.mockReset();
  dbSelectMock.mockResolvedValue([]);

  minerMock.mockReset();
  minerMock.mockResolvedValue({
    slug: "vanta",
    hotkey: "hk",
    apiUrl: null, // No miner call → goes straight to DB insert
    apiKey: null,
    usdcWallet: "0x9999999999999999999999999999999999999999",
  });
  tiersMock.mockReset();
  tiersMock.mockResolvedValue([
    { accountSize: 1000, priceUsdc: "0", isActive: true },
  ]);

  // Skip the miner call entirely in tests via env flag the route honors.
  process.env.SKIP_ENTITY_MINER_CALL = "true";
});

afterEach(() => {
  delete process.env.SKIP_ENTITY_MINER_CALL;
  vi.useRealTimers();
});

describe("POST /api/register — wallet ownership gate", () => {
  it("returns 401 when no signature headers are present (free flow)", async () => {
    const res = await POST(
      makeRequest({
        body: {
          minerSlug: "vanta",
          hlAddress: HL_ADDRESS,
          accountSize: 1000,
          tierIndex: 0,
          paymentMethod: "free",
          email: "user@example.com",
        },
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Missing authentication headers/);
    expect(verifyHeadersMock).toHaveBeenCalledOnce();
  });

  it("returns 401 when the signature itself is invalid", async () => {
    verifyHeadersMock.mockRejectedValue(new Error("Invalid signature"));
    const res = await POST(
      makeRequest({
        body: {
          minerSlug: "vanta",
          hlAddress: HL_ADDRESS,
          accountSize: 1000,
          tierIndex: 0,
          paymentMethod: "free",
          email: "user@example.com",
        },
        headers: {
          "x-wallet": HL_ADDRESS,
          "x-signature": "0xbad",
          "x-nonce": String(Date.now()),
        },
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid signature/);
  });

  it("returns 403 when the signing wallet does not match hl_address", async () => {
    verifyHeadersMock.mockResolvedValue({ wallet: OTHER_WALLET });
    const res = await POST(
      makeRequest({
        body: {
          minerSlug: "vanta",
          hlAddress: HL_ADDRESS,
          accountSize: 1000,
          tierIndex: 0,
          paymentMethod: "free",
          email: "user@example.com",
        },
        headers: {
          "x-wallet": OTHER_WALLET,
          "x-signature": "0xfake",
          "x-nonce": String(Date.now()),
        },
      }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/signing wallet must match/);
  });

  it("accepts the request when signing wallet matches hl_address (free flow)", async () => {
    verifyHeadersMock.mockResolvedValue({ wallet: HL_ADDRESS });
    const res = await POST(
      makeRequest({
        body: {
          minerSlug: "vanta",
          hlAddress: HL_ADDRESS,
          accountSize: 1000,
          tierIndex: 0,
          paymentMethod: "free",
          email: "user@example.com",
        },
        headers: {
          "x-wallet": HL_ADDRESS,
          "x-signature": "0xok",
          "x-nonce": String(Date.now()),
        },
      }),
    );
    // Gate passed → free flow proceeds → miner call skipped via env flag
    // → DB insert happens → 200 with "registered". (Two inserts are
    // fired internally — one for the user upsert, one for the
    // registration row — so we just assert insert was called rather
    // than pinning to a specific count.)
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("registered");
    expect(dbInsertMock).toHaveBeenCalled();
  });

  it("compares wallets case-insensitively", async () => {
    verifyHeadersMock.mockResolvedValue({ wallet: HL_ADDRESS.toUpperCase() });
    const res = await POST(
      makeRequest({
        body: {
          minerSlug: "vanta",
          hlAddress: HL_ADDRESS.toLowerCase(),
          accountSize: 1000,
          tierIndex: 0,
          paymentMethod: "free",
          email: "user@example.com",
        },
        headers: {
          "x-wallet": HL_ADDRESS.toUpperCase(),
          "x-signature": "0xok",
          "x-nonce": String(Date.now()),
        },
      }),
    );
    expect(res.status).toBe(200);
  });

  it("skips the gate on an unsigned x402 probe (paymentMethod missing AND no payment-signature header)", async () => {
    // No signature headers, no paymentMethod, no payment-signature → probe.
    // The route should respond with 402 (payment required) without ever
    // touching verifyWalletHeaders.
    const res = await POST(
      makeRequest({
        body: {
          minerSlug: "vanta",
          hlAddress: HL_ADDRESS,
          accountSize: 1000,
          tierIndex: 0,
          email: "user@example.com",
          // paymentMethod intentionally omitted → x402 path
        },
      }),
    );
    expect(res.status).toBe(402);
    expect(verifyHeadersMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/register — message binding", () => {
  it("forwards the canonical pathname and the raw body to the verifier", async () => {
    verifyHeadersMock.mockResolvedValue({ wallet: HL_ADDRESS });
    const bodyObj = {
      minerSlug: "vanta",
      hlAddress: HL_ADDRESS,
      accountSize: 1000,
      tierIndex: 0,
      paymentMethod: "free",
      email: "user@example.com",
    };
    const bodyText = JSON.stringify(bodyObj);

    await POST(
      makeRequest({
        body: bodyText,
        headers: {
          "x-wallet": HL_ADDRESS,
          "x-signature": "0xok",
          "x-nonce": String(Date.now()),
        },
      }),
    );

    expect(verifyHeadersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/api/register",
        bodyText,
        headers: expect.objectContaining({
          wallet: HL_ADDRESS,
          signature: "0xok",
        }),
      }),
    );
  });
});
