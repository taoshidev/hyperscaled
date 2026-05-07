import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

process.env.STUB_GATEWAY = "false";

const getMinerBySlugMock = vi.fn();
const getTiersForMinerMock = vi.fn();
const getDbMock = vi.fn();
const checkValidatorStatusMock = vi.fn();
const reportErrorMock = vi.fn();

vi.mock("@/lib/miners", () => ({
  getMinerBySlug: (...args) => getMinerBySlugMock(...args),
  getTiersForMiner: (...args) => getTiersForMinerMock(...args),
}));

vi.mock("@/lib/db", () => ({
  getDb: (...args) => getDbMock(...args),
}));

vi.mock("@/lib/validator", async () => {
  const actual = await vi.importActual("@/lib/validator");
  return {
    ...actual,
    checkValidatorStatus: (...args) => checkValidatorStatusMock(...args),
  };
});

vi.mock("@/lib/errors", () => ({
  reportError: (...args) => reportErrorMock(...args),
}));

const { POST } = await import("@/app/api/register/preflight/route.js");

const HL_ADDRESS = "0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1";
const MINER_HOTKEY = "5GCUMqFigwvKh62LdJXYYr3pHhCvpAhWbF83DqB2ZUDZRKwM";

const PAID_TIER = { isActive: true, accountSize: 25000, priceUsdc: "239.00" };
const FREE_TIER = { isActive: true, accountSize: 1000, priceUsdc: "0.00" };

function makeRequest(body) {
  return {
    headers: { get: () => null },
    json: async () => body,
  };
}

function makeDbReturning(existingRow) {
  return {
    select() {
      const chain = {
        from() { return chain; },
        where() { return chain; },
        async limit() {
          return existingRow ? [existingRow] : [];
        },
      };
      return chain;
    },
  };
}

beforeEach(() => {
  getMinerBySlugMock.mockReset().mockResolvedValue({
    hotkey: MINER_HOTKEY,
    slug: "vanta",
  });
  getTiersForMinerMock.mockReset();
  getDbMock.mockReset();
  checkValidatorStatusMock.mockReset();
  reportErrorMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/register/preflight — pending row reconciliation", () => {
  function makeBody(tier) {
    return {
      minerSlug: "vanta",
      hlAddress: HL_ADDRESS,
      accountSize: tier.accountSize,
      tierIndex: 0,
      email: "user@example.com",
    };
  }

  it("blocks PAID pending rows with 409 without consulting the validator", async () => {
    getTiersForMinerMock.mockResolvedValue([PAID_TIER]);
    getDbMock.mockResolvedValue(
      makeDbReturning({ id: 1, status: "pending", priceUsdc: "239.00" }),
    );

    const res = await POST(makeRequest(makeBody(PAID_TIER)));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already being processed/i);
    // Critical: don't waste a validator round-trip on confirmed paid pending rows.
    expect(checkValidatorStatusMock).not.toHaveBeenCalled();
  });

  it("blocks FREE pending rows with 409 when validator says still active", async () => {
    getTiersForMinerMock.mockResolvedValue([FREE_TIER]);
    getDbMock.mockResolvedValue(
      makeDbReturning({ id: 2, status: "pending", priceUsdc: "0.00" }),
    );
    checkValidatorStatusMock.mockResolvedValue({ status: "active" });

    const res = await POST(makeRequest(makeBody(FREE_TIER)));
    expect(res.status).toBe(409);
    expect(checkValidatorStatusMock).toHaveBeenCalledWith(HL_ADDRESS);
  });

  it("ALLOWS FREE pending rows when validator confirms 'not_found' (stale row)", async () => {
    getTiersForMinerMock.mockResolvedValue([FREE_TIER]);
    getDbMock.mockResolvedValue(
      makeDbReturning({ id: 3, status: "pending", priceUsdc: "0.00" }),
    );
    checkValidatorStatusMock.mockResolvedValue({ status: "not_found" });

    const res = await POST(makeRequest(makeBody(FREE_TIER)));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("ALLOWS FREE pending rows when validator returns 'failed' / 'eliminated' / 'inactive'", async () => {
    for (const status of ["failed", "eliminated", "inactive", "deregistered"]) {
      getTiersForMinerMock.mockResolvedValue([FREE_TIER]);
      getDbMock.mockResolvedValue(
        makeDbReturning({ id: 3, status: "pending", priceUsdc: "0.00" }),
      );
      checkValidatorStatusMock.mockResolvedValue({ status });
      const res = await POST(makeRequest(makeBody(FREE_TIER)));
      expect(res.status, `for validator status=${status}`).toBe(200);
    }
  });

  it("blocks FREE pending rows when validator is unreachable ('unknown')", async () => {
    getTiersForMinerMock.mockResolvedValue([FREE_TIER]);
    getDbMock.mockResolvedValue(
      makeDbReturning({ id: 3, status: "pending", priceUsdc: "0.00" }),
    );
    checkValidatorStatusMock.mockResolvedValue({ status: "unknown" });

    const res = await POST(makeRequest(makeBody(FREE_TIER)));
    expect(res.status).toBe(409);
  });

  it("blocks REGISTERED rows with 409 when validator says still active", async () => {
    getTiersForMinerMock.mockResolvedValue([PAID_TIER]);
    getDbMock.mockResolvedValue(
      makeDbReturning({ id: 4, status: "registered", priceUsdc: "239.00" }),
    );
    checkValidatorStatusMock.mockResolvedValue({ status: "active" });

    const res = await POST(makeRequest(makeBody(PAID_TIER)));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already registered/i);
  });

  it("ALLOWS REGISTERED rows when validator confirms de-registration", async () => {
    getTiersForMinerMock.mockResolvedValue([PAID_TIER]);
    getDbMock.mockResolvedValue(
      makeDbReturning({ id: 5, status: "registered", priceUsdc: "239.00" }),
    );
    checkValidatorStatusMock.mockResolvedValue({ status: "not_found" });

    const res = await POST(makeRequest(makeBody(PAID_TIER)));
    expect(res.status).toBe(200);
  });

  it("falls through and returns 200 when no existing row is present", async () => {
    getTiersForMinerMock.mockResolvedValue([PAID_TIER]);
    getDbMock.mockResolvedValue(makeDbReturning(null));

    const res = await POST(makeRequest(makeBody(PAID_TIER)));
    expect(res.status).toBe(200);
    expect(checkValidatorStatusMock).not.toHaveBeenCalled();
  });
});
