/**
 * Notion #1560 — Hyperscaled sunset. Every path that can create an account
 * must refuse with the same user-readable 410 before touching the database,
 * the miner, or a payment facilitator:
 *
 *   - POST /api/register            (web checkout, SDK/CLI, extension)
 *   - POST /api/register/preflight  (runs before every client-side payment)
 *   - POST /api/testnet-register    (staging tool)
 *   - POST /api/vanta-sync          (action: sync_registration only)
 *
 * KYC for unknown wallets is covered in api-kyc-token.test.js.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getDbMock = vi.fn();
vi.mock("@/lib/db", () => ({ getDb: (...a) => getDbMock(...a) }));

const reportCriticalMock = vi.fn().mockResolvedValue(undefined);
const flushErrorsMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/errors", () => ({
  reportError: vi.fn(),
  reportCritical: (...a) => reportCriticalMock(...a),
  flushErrors: (...a) => flushErrorsMock(...a),
  SEVERITY: { ERROR: "error", WARNING: "warning", CRITICAL: "critical" },
}));

const getMinerBySlugMock = vi.fn();
vi.mock("@/lib/miners", () => ({
  getMinerBySlug: (...a) => getMinerBySlugMock(...a),
  getTiersForMiner: vi.fn(),
  TIERS: [],
}));

const checkValidatorStatusMock = vi.fn();
vi.mock("@/lib/validator", () => ({
  checkValidatorStatus: (...a) => checkValidatorStatusMock(...a),
  isConfirmedDeregistered: () => false,
}));

const verifyWalletHeadersMock = vi.fn();
vi.mock("@/lib/wallet-auth.js", () => ({
  verifyWalletHeaders: (...a) => verifyWalletHeadersMock(...a),
  verifyWalletSignature: vi.fn(),
  buildSignedMessage: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/tolt", () => ({ trackConversion: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: vi.fn(), captureException: vi.fn() }));
vi.mock("@coinbase/x402", () => ({ facilitator: {} }));
vi.mock("@x402/core/server", () => ({ HTTPFacilitatorClient: class {} }));
vi.mock("@x402/core/http", () => ({
  encodePaymentRequiredHeader: () => "",
  decodePaymentSignatureHeader: () => ({}),
  encodePaymentResponseHeader: () => "",
}));

const { POST: register } = await import("@/app/api/register/route.js");
const { POST: preflight } = await import("@/app/api/register/preflight/route.js");
const { POST: testnetRegister } = await import("@/app/api/testnet-register/route.js");
const { POST: vantaSync } = await import("@/app/api/vanta-sync/route.js");

const HL = "0x1111111111111111111111111111111111111111";
const EXPECTED_MESSAGE =
  "Hyperscaled is no longer accepting new accounts. Hyperscaled is being retired on December 15, 2026, so we've closed new registrations. If you'd like to trade with us, you can create a Vanta Trading account instead.";

const baseBody = {
  minerSlug: "vanta",
  hlAddress: HL,
  accountSize: 5000,
  tierIndex: 1,
  email: "trader@example.com",
};

function post(path, body, headers = {}) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function expectClosed(res) {
  expect(res.status).toBe(410);
  const body = await res.json();
  expect(body).toEqual({
    error: EXPECTED_MESSAGE,
    code: "REGISTRATIONS_CLOSED",
    url: "https://vantatrading.io",
  });
}

function expectNoSideEffects() {
  expect(getDbMock).not.toHaveBeenCalled();
  expect(getMinerBySlugMock).not.toHaveBeenCalled();
  expect(checkValidatorStatusMock).not.toHaveBeenCalled();
  expect(verifyWalletHeadersMock).not.toHaveBeenCalled();
}

const ENV_KEYS = [
  "ENABLE_TESTNET_REGISTER",
  "TESTNET_REGISTER_SECRET",
  "VANTA_SYNC_API_KEY",
];
const savedEnv = {};

beforeEach(() => {
  vi.clearAllMocks();
  verifyWalletHeadersMock.mockReset();
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("POST /api/register — closed", () => {
  it("refuses the unsigned x402 probe (SDK/CLI first call) with the closure message", async () => {
    const res = await register(post("/api/register", baseBody));
    await expectClosed(res);
    expectNoSideEffects();
    expect(reportCriticalMock).not.toHaveBeenCalled();
  });

  it("refuses a free-tier registration", async () => {
    const res = await register(post("/api/register", { ...baseBody, paymentMethod: "free" }));
    await expectClosed(res);
    expectNoSideEffects();
  });

  it("refuses an x402 settle call before any facilitator work", async () => {
    const res = await register(
      post("/api/register", baseBody, { "payment-signature": "signed-payload" }),
    );
    await expectClosed(res);
    expectNoSideEffects();
  });

  const MINER_WALLET = "0x9999999999999999999999999999999999999999";
  const SUFFIX =
    " If you already sent a payment, please contact support with your transaction hash.";
  const hashFor = (n) => `0x${n.toString(16).padStart(2, "0").repeat(32)}`;
  const transferBody = (hash) => ({
    ...baseBody,
    paymentMethod: "eip712",
    hlTransferHash: hash,
    hlTransferSender: HL,
  });
  const ledgerWith = (hash, delta = {}) => [
    {
      hash,
      time: 1_700_000_000_000,
      delta: { type: "send", token: "USDC", destination: MINER_WALLET, amount: "74.0", ...delta },
    },
  ];
  let fetchSpy;
  let recordedRows;

  function mockHlLedger(updates) {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(updates), { status: 200 }),
    );
  }

  beforeEach(() => {
    recordedRows = [];
    getMinerBySlugMock.mockResolvedValue({ slug: "vanta", usdcWallet: MINER_WALLET });
    getDbMock.mockResolvedValue({
      select: () => ({ from: () => ({ where: () => ({ limit: async () => recordedRows }) }) }),
    });
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
    fetchSpy = undefined;
  });

  async function expectClosedWithSupportHint(res) {
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.code).toBe("REGISTRATIONS_CLOSED");
    expect(body.error).toBe(`${EXPECTED_MESSAGE}${SUFFIX}`);
  }

  it("pages ops once for a confirmed, unrecorded transfer to the miner wallet", async () => {
    const hash = hashFor(0x11);
    mockHlLedger(ledgerWith(hash));
    await expectClosedWithSupportHint(await register(post("/api/register", transferBody(hash))));

    const [ledgerUrl, ledgerInit] = fetchSpy.mock.calls[0];
    expect(ledgerUrl).toBe("https://api.hyperliquid.xyz/info");
    expect(JSON.parse(ledgerInit.body)).toMatchObject({ type: "userNonFundingLedgerUpdates", user: HL });
    expect(reportCriticalMock).toHaveBeenCalledTimes(1);
    const [, context] = reportCriticalMock.mock.calls[0];
    expect(context.metadata).toMatchObject({
      step: "registrations_closed_after_transfer",
      hlTransferHash: hash,
      sender: HL,
      minerWallet: MINER_WALLET,
      amount: "74.0",
    });
    expect(flushErrorsMock).toHaveBeenCalled();
    // No write path is reached; the gate never verifies signatures or consumes nonces.
    expect(verifyWalletHeadersMock).not.toHaveBeenCalled();

    // A replay of the same hash does not page again.
    await expectClosedWithSupportHint(await register(post("/api/register", transferBody(hash))));
    expect(reportCriticalMock).toHaveBeenCalledTimes(1);
  });

  it("does not page when Hyperliquid has no such transfer", async () => {
    const hash = hashFor(0x12);
    mockHlLedger(ledgerWith(hashFor(0x13)));
    await expectClosedWithSupportHint(await register(post("/api/register", transferBody(hash))));
    expect(reportCriticalMock).not.toHaveBeenCalled();
  });

  it("does not page for a transfer to a wallet that is not the miner's", async () => {
    const hash = hashFor(0x14);
    mockHlLedger(ledgerWith(hash, { destination: "0x2222222222222222222222222222222222222222" }));
    await expectClosedWithSupportHint(await register(post("/api/register", transferBody(hash))));
    expect(reportCriticalMock).not.toHaveBeenCalled();
  });

  it("does not page for a transfer that already has a registration", async () => {
    const hash = hashFor(0x15);
    mockHlLedger(ledgerWith(hash));
    recordedRows = [{ id: 42 }];
    await expectClosedWithSupportHint(await register(post("/api/register", transferBody(hash))));
    expect(reportCriticalMock).not.toHaveBeenCalled();
  });

  it("still answers 410 when the Hyperliquid lookup fails", async () => {
    const hash = hashFor(0x16);
    fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    await expectClosedWithSupportHint(await register(post("/api/register", transferBody(hash))));
    expect(reportCriticalMock).not.toHaveBeenCalled();
  });

  it("never 500s on crafted field types", async () => {
    const hash = hashFor(0x17);
    mockHlLedger(ledgerWith(hash));
    const res = await register(
      post("/api/register", {
        ...transferBody(hash),
        hlTransferSender: { toString: 1 },
        hlAddress: ["0x1"],
        minerSlug: { toString: 1 },
        tierIndex: { toString: 1 },
      }),
    );
    await expectClosedWithSupportHint(res);
    expect(reportCriticalMock).not.toHaveBeenCalled();
  });

  it("does not look anything up for a malformed transfer hash", async () => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await register(
      post("/api/register", { ...transferBody(hashFor(0x18)), hlTransferHash: "0xnot-a-hash" }),
    );
    await expectClosed(res);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(reportCriticalMock).not.toHaveBeenCalled();
  });

  it("does not look anything up for a hash on a non-Hyperliquid payment method", async () => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await register(
      post("/api/register", { ...transferBody(hashFor(0x19)), paymentMethod: "free" }),
    );
    await expectClosed(res);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(reportCriticalMock).not.toHaveBeenCalled();
  });

  it("still returns the closure message for a malformed body", async () => {
    const res = await register(
      new Request("http://localhost/api/register", { method: "POST", body: "not json" }),
    );
    await expectClosed(res);
    expect(reportCriticalMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/register/preflight — closed", () => {
  it("refuses before the client can sign or send a payment", async () => {
    const res = await preflight(post("/api/register/preflight", baseBody));
    await expectClosed(res);
    expectNoSideEffects();
  });
});

describe("POST /api/testnet-register — closed", () => {
  it("keeps the route hidden (404) when it is not enabled", async () => {
    delete process.env.ENABLE_TESTNET_REGISTER;
    const res = await testnetRegister(post("/api/testnet-register", baseBody));
    expect(res.status).toBe(404);
  });

  it("keeps the secret check ahead of the closure", async () => {
    process.env.ENABLE_TESTNET_REGISTER = "true";
    process.env.TESTNET_REGISTER_SECRET = "s3cret";
    const res = await testnetRegister(
      post("/api/testnet-register", baseBody, { "x-testnet-secret": "wrong" }),
    );
    expect(res.status).toBe(401);
  });

  it("refuses an authenticated staging registration", async () => {
    process.env.ENABLE_TESTNET_REGISTER = "true";
    process.env.TESTNET_REGISTER_SECRET = "s3cret";
    const res = await testnetRegister(
      post("/api/testnet-register", baseBody, { "x-testnet-secret": "s3cret" }),
    );
    await expectClosed(res);
    expectNoSideEffects();
  });
});

describe("POST /api/vanta-sync — closed for sync_registration only", () => {
  it("keeps auth ahead of the closure", async () => {
    process.env.VANTA_SYNC_API_KEY = "sync-key";
    const res = await vantaSync(
      post("/api/vanta-sync", { action: "sync_registration" }, { authorization: "Bearer nope" }),
    );
    expect(res.status).toBe(401);
  });

  it("refuses sync_registration without writing", async () => {
    process.env.VANTA_SYNC_API_KEY = "sync-key";
    const res = await vantaSync(
      post(
        "/api/vanta-sync",
        {
          action: "sync_registration",
          hlAddress: HL,
          accountSize: 5000,
          tierIndex: 1,
          priceUsdc: "49",
          txHash: "0xdef",
          minerHotkey: "5Hotkey",
        },
        { authorization: "Bearer sync-key" },
      ),
    );
    await expectClosed(res);
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("still processes sync_kyc for existing users", async () => {
    process.env.VANTA_SYNC_API_KEY = "sync-key";
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    getDbMock.mockResolvedValue({
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [{ id: 7, wallet: HL }] }) }),
      }),
      update: () => ({ set: () => ({ where: updateWhere }) }),
    });
    const res = await vantaSync(
      post(
        "/api/vanta-sync",
        { action: "sync_kyc", wallet: HL, kycStatus: "approved" },
        { authorization: "Bearer sync-key" },
      ),
    );
    expect(res.status).toBe(200);
    expect(updateWhere).toHaveBeenCalledTimes(1);
  });
});
