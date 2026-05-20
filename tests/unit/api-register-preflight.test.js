import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

process.env.STUB_GATEWAY = "false";

const getMinerBySlugMock = vi.fn();
const getTiersForMinerMock = vi.fn();
const getDbMock = vi.fn();
const checkValidatorStatusMock = vi.fn();
const reportErrorMock = vi.fn();
const checkRegistrationCapMock = vi.fn();

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

vi.mock("@/lib/registration-capacity", () => ({
  checkRegistrationCap: (...args) => checkRegistrationCapMock(...args),
  REGISTRATION_CAP_CODE: {
    FREE: "REGISTRATION_FREE_CAP",
    PAID: "REGISTRATION_PAID_CAP",
  },
}));

const { POST } = await import("@/app/api/register/preflight/route.js");

const HL_ADDRESS = "0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1";
const MINER_HOTKEY = "5GCUMqFigwvKh62LdJXYYr3pHhCvpAhWbF83DqB2ZUDZRKwM";

const PAID_TIER = { isActive: true, accountSize: 25000, priceUsdc: "119.00" };
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
  // Default: caps are not configured, so cap check is a no-op. Individual
  // tests in the cap-enforcement describe block override.
  checkRegistrationCapMock.mockReset().mockResolvedValue(null);
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
      makeDbReturning({ id: 1, status: "pending", priceUsdc: "119.00" }),
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
      makeDbReturning({ id: 4, status: "registered", priceUsdc: "119.00" }),
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
      makeDbReturning({ id: 5, status: "registered", priceUsdc: "119.00" }),
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

describe("POST /api/register/preflight — registration cap enforcement", () => {
  function makeBody(tier) {
    return {
      minerSlug: "vanta",
      hlAddress: HL_ADDRESS,
      accountSize: tier.accountSize,
      tierIndex: 0,
      email: "user@example.com",
    };
  }

  it("rejects with 403 + REGISTRATION_FREE_CAP when free cap is reached", async () => {
    getTiersForMinerMock.mockResolvedValue([FREE_TIER]);
    // No DB query needed — the cap check short-circuits before the
    // duplicate lookup.
    getDbMock.mockResolvedValue(makeDbReturning(null));
    checkRegistrationCapMock.mockResolvedValue({
      code: "REGISTRATION_FREE_CAP",
      error: "Free challenge accounts are full right now.",
    });

    const res = await POST(makeRequest(makeBody(FREE_TIER)));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("REGISTRATION_FREE_CAP");
    expect(body.error).toMatch(/full/i);
    // Cap check was passed the canonical DB price, not the client value.
    expect(checkRegistrationCapMock).toHaveBeenCalledWith(FREE_TIER.priceUsdc, {
      minerHotkey: MINER_HOTKEY,
      accountSize: FREE_TIER.accountSize,
    });
  });

  it("rejects with 403 + REGISTRATION_PAID_CAP when paid cap is reached", async () => {
    getTiersForMinerMock.mockResolvedValue([PAID_TIER]);
    getDbMock.mockResolvedValue(makeDbReturning(null));
    checkRegistrationCapMock.mockResolvedValue({
      code: "REGISTRATION_PAID_CAP",
      error: "Registrations are paused.",
    });

    const res = await POST(makeRequest(makeBody(PAID_TIER)));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("REGISTRATION_PAID_CAP");
    expect(checkRegistrationCapMock).toHaveBeenCalledWith(PAID_TIER.priceUsdc, {
      minerHotkey: MINER_HOTKEY,
      accountSize: PAID_TIER.accountSize,
    });
  });

  it("does not consult the validator when blocked by a cap", async () => {
    getTiersForMinerMock.mockResolvedValue([FREE_TIER]);
    getDbMock.mockResolvedValue(makeDbReturning(null));
    checkRegistrationCapMock.mockResolvedValue({
      code: "REGISTRATION_FREE_CAP",
      error: "Full.",
    });

    await POST(makeRequest(makeBody(FREE_TIER)));
    expect(checkValidatorStatusMock).not.toHaveBeenCalled();
  });

  it("passes through to duplicate check when caps allow", async () => {
    getTiersForMinerMock.mockResolvedValue([PAID_TIER]);
    getDbMock.mockResolvedValue(makeDbReturning(null));
    checkRegistrationCapMock.mockResolvedValue(null);

    const res = await POST(makeRequest(makeBody(PAID_TIER)));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/register/preflight — email required", () => {
  function bodyWithoutEmail(tier) {
    return {
      minerSlug: "vanta",
      hlAddress: HL_ADDRESS,
      accountSize: tier.accountSize,
      tierIndex: 0,
    };
  }

  it("rejects with 400 + EMAIL_REQUIRED when email is missing", async () => {
    const res = await POST(makeRequest(bodyWithoutEmail(PAID_TIER)));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("EMAIL_REQUIRED");
    expect(body.error).toMatch(/email/i);
    // Short-circuit: no miner / tier / cap lookups when email is missing.
    expect(getTiersForMinerMock).not.toHaveBeenCalled();
    expect(checkRegistrationCapMock).not.toHaveBeenCalled();
  });

  it("rejects with 400 (no code) when email is malformed", async () => {
    const res = await POST(
      makeRequest({ ...bodyWithoutEmail(PAID_TIER), email: "not-an-email" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid email/i);
    expect(body.code).toBeUndefined();
  });
});
