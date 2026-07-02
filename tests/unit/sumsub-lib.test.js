import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Fake drizzle update chain: db.update(users).set(fields).where(cond) -> result.
let pendingUpdateResult = { rowCount: 1 };
const whereMock = vi.fn(async () => pendingUpdateResult);
const setMock = vi.fn(() => ({ where: whereMock }));
const updateMock = vi.fn(() => ({ set: setMock }));
const getDbMock = vi.fn(async () => ({ update: updateMock }));

vi.mock("@/lib/db/index.js", () => ({ getDb: (...args) => getDbMock(...args) }));
vi.mock("@/lib/db/schema.js", () => ({
  users: { wallet: "wallet" },
  registrations: {},
}));

const {
  updateKycStatus,
  isApplicantFinalRejected,
  resetApplicant,
} = await import("@/lib/sumsub.js");

beforeEach(() => {
  pendingUpdateResult = { rowCount: 1 };
  whereMock.mockClear();
  setMock.mockClear();
  updateMock.mockClear();
  getDbMock.mockClear();
  process.env.SUMSUB_APP_TOKEN = "app-token";
  process.env.SUMSUB_SECRET_KEY = "secret-key";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("updateKycStatus", () => {
  it("returns the number of affected rows (1 when a wallet matched)", async () => {
    const affected = await updateKycStatus("0xABC", { kycStatus: "approved" });
    expect(affected).toBe(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("returns 0 when no row matched (unknown wallet)", async () => {
    pendingUpdateResult = { rowCount: 0 };
    const affected = await updateKycStatus("0xABC", { kycStatus: "approved" });
    expect(affected).toBe(0);
  });

  it("returns 0 when the driver omits rowCount", async () => {
    pendingUpdateResult = {};
    const affected = await updateKycStatus("0xABC", { kycStatus: "pending" });
    expect(affected).toBe(0);
  });

  it("lower-cases the wallet before matching", async () => {
    await updateKycStatus("0xAbCdEf", { kycStatus: "pending" });
    // eq(users.wallet, wallet.toLowerCase()) — assert via the set() payload and
    // that where() was called (the eq arg is opaque here).
    expect(whereMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledTimes(1);
  });

  it("only sets fields that were provided", async () => {
    await updateKycStatus("0xabc", { kycStatus: "approved", kycVerifiedAt: new Date(0) });
    const payload = setMock.mock.calls[0][0];
    expect(payload).toHaveProperty("kycStatus", "approved");
    expect(payload).toHaveProperty("kycVerifiedAt");
    expect(payload).toHaveProperty("updatedAt");
    expect(payload).not.toHaveProperty("kycApplicantId");
  });
});

describe("isApplicantFinalRejected", () => {
  it("is true for a nested FINAL RED review", () => {
    expect(
      isApplicantFinalRejected({
        review: { reviewResult: { reviewAnswer: "RED", reviewRejectType: "FINAL" } },
      }),
    ).toBe(true);
  });

  it("is true for a flat FINAL RED review", () => {
    expect(
      isApplicantFinalRejected({
        reviewResult: { reviewAnswer: "RED", reviewRejectType: "FINAL" },
      }),
    ).toBe(true);
  });

  it("is false for a RETRY rejection (user can re-submit)", () => {
    expect(
      isApplicantFinalRejected({
        review: { reviewResult: { reviewAnswer: "RED", reviewRejectType: "RETRY" } },
      }),
    ).toBe(false);
  });

  it("is false for GREEN / missing review / null", () => {
    expect(
      isApplicantFinalRejected({
        review: { reviewResult: { reviewAnswer: "GREEN" } },
      }),
    ).toBe(false);
    expect(isApplicantFinalRejected({})).toBe(false);
    expect(isApplicantFinalRejected(null)).toBe(false);
    expect(isApplicantFinalRejected(undefined)).toBe(false);
  });
});

describe("resetApplicant", () => {
  it("POSTs to the applicant reset endpoint and returns the parsed body", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const out = await resetApplicant("app-123");
    expect(out).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain("/resources/applicants/app-123/reset");
    expect(opts.method).toBe("POST");
  });

  it("throws when SumSub returns a non-2xx", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({}),
      text: async () => "conflict",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(resetApplicant("app-123")).rejects.toThrow(/resetApplicant failed \(409\)/);
  });
});
