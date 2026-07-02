import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const userMock = vi.fn();
const getApplicantMock = vi.fn();
const updateKycStatusMock = vi.fn();

vi.mock("@/lib/sumsub.js", () => ({
  getUserByWallet: (...args) => userMock(...args),
  getApplicant: (...args) => getApplicantMock(...args),
  updateKycStatus: (...args) => updateKycStatusMock(...args),
}));

vi.mock("@/lib/errors", () => ({ reportError: vi.fn() }));

const { GET } = await import("@/app/api/kyc/status/route.js");

const A = "0x1111111111111111111111111111111111111111";

function makeRequest(wallet) {
  return {
    url: `http://localhost:4568/api/kyc/status?wallet=${wallet}`,
  };
}

beforeEach(() => {
  userMock.mockReset();
  getApplicantMock.mockReset().mockResolvedValue(null);
  updateKycStatusMock.mockReset().mockResolvedValue(1);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/kyc/status (public read)", () => {
  it("returns 400 for an invalid wallet query param", async () => {
    const res = await GET(makeRequest("not-an-address"));
    expect(res.status).toBe(400);
    expect(userMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the wallet param is missing entirely", async () => {
    const res = await GET({ url: "http://localhost:4568/api/kyc/status" });
    expect(res.status).toBe(400);
  });

  it("returns a 'none' record (200) for a wallet that has no user row yet", async () => {
    userMock.mockResolvedValue(null);
    const res = await GET(makeRequest(A));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      wallet: A.toLowerCase(),
      kycStatus: "none",
      verified: false,
      verifiedAt: null,
    });
  });

  it("returns the user's KYC status for an existing wallet", async () => {
    const verifiedAt = new Date("2026-01-15T00:00:00Z");
    userMock.mockResolvedValue({
      wallet: A,
      kycStatus: "approved",
      kycVerifiedAt: verifiedAt,
    });
    const res = await GET(makeRequest(A));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(true);
    expect(body.kycStatus).toBe("approved");
    expect(new Date(body.verifiedAt).toISOString()).toBe(verifiedAt.toISOString());
  });

  it("does NOT leak the authorizedWallets list in the public response", async () => {
    userMock.mockResolvedValue({
      wallet: A,
      kycStatus: "approved",
      kycVerifiedAt: new Date(),
    });
    const res = await GET(makeRequest(A));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).not.toHaveProperty("authorizedWallets");
  });

  it("does not require any authentication headers (no x-wallet / x-signature)", async () => {
    userMock.mockResolvedValue(null);
    const res = await GET(makeRequest(A));
    expect(res.status).toBe(200);
  });

  it("returns 500 when the underlying user lookup blows up", async () => {
    userMock.mockRejectedValue(new Error("db down"));
    const res = await GET(makeRequest(A));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/Internal/);
  });

  it("does not reconcile a non-pending status against SumSub", async () => {
    userMock.mockResolvedValue({
      wallet: A,
      kycStatus: "approved",
      kycVerifiedAt: new Date(),
    });
    await GET(makeRequest(A));
    expect(getApplicantMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/kyc/status — pending reconciliation fallback", () => {
  beforeEach(() => {
    userMock.mockResolvedValue({
      wallet: A,
      kycStatus: "pending",
      kycVerifiedAt: null,
    });
  });

  it("promotes to approved when SumSub reports a GREEN review (missed webhook)", async () => {
    getApplicantMock.mockResolvedValue({
      review: { reviewResult: { reviewAnswer: "GREEN" } },
    });
    const res = await GET(makeRequest(A));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kycStatus).toBe("approved");
    expect(body.verified).toBe(true);
    expect(body.verifiedAt).not.toBeNull();
    expect(updateKycStatusMock).toHaveBeenCalledWith(
      A,
      expect.objectContaining({ kycStatus: "approved" }),
    );
  });

  it("moves to rejected when SumSub reports a RED review", async () => {
    getApplicantMock.mockResolvedValue({
      review: { reviewResult: { reviewAnswer: "RED", reviewRejectType: "FINAL" } },
    });
    const res = await GET(makeRequest(A));
    const body = await res.json();
    expect(body.kycStatus).toBe("rejected");
    expect(body.verified).toBe(false);
    expect(updateKycStatusMock).toHaveBeenCalledWith(A, { kycStatus: "rejected" });
  });

  it("stays pending when SumSub has no terminal result yet", async () => {
    getApplicantMock.mockResolvedValue({
      review: { reviewResult: {} },
    });
    const res = await GET(makeRequest(A));
    const body = await res.json();
    expect(body.kycStatus).toBe("pending");
    expect(updateKycStatusMock).not.toHaveBeenCalled();
  });

  it("falls back to the stored 'pending' when the SumSub lookup fails", async () => {
    getApplicantMock.mockRejectedValue(new Error("sumsub down"));
    const res = await GET(makeRequest(A));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kycStatus).toBe("pending");
  });
});
