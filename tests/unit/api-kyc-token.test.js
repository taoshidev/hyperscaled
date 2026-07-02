import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = {
  getUserByWallet: vi.fn(),
  createUserByWallet: vi.fn(),
  getApplicant: vi.fn(),
  createApplicant: vi.fn(),
  generateAccessToken: vi.fn(),
  updateKycStatus: vi.fn(),
  getAuthorizedWalletsForHlAddress: vi.fn(),
  resetApplicant: vi.fn(),
  isApplicantFinalRejected: vi.fn(),
};

vi.mock("@/lib/sumsub", () => ({
  getUserByWallet: (...a) => mocks.getUserByWallet(...a),
  createUserByWallet: (...a) => mocks.createUserByWallet(...a),
  getApplicant: (...a) => mocks.getApplicant(...a),
  createApplicant: (...a) => mocks.createApplicant(...a),
  generateAccessToken: (...a) => mocks.generateAccessToken(...a),
  updateKycStatus: (...a) => mocks.updateKycStatus(...a),
  getAuthorizedWalletsForHlAddress: (...a) =>
    mocks.getAuthorizedWalletsForHlAddress(...a),
  resetApplicant: (...a) => mocks.resetApplicant(...a),
  isApplicantFinalRejected: (...a) => mocks.isApplicantFinalRejected(...a),
}));

vi.mock("@/lib/validation", () => ({
  isValidEvmAddress: (a) => /^0x[0-9a-fA-F]{40}$/.test(a),
}));

vi.mock("@/lib/errors", () => ({ reportError: vi.fn() }));

const { POST } = await import("@/app/api/kyc/token/route.js");

const WALLET = "0x1111111111111111111111111111111111111111";

function makeReq(body) {
  return {
    async json() {
      return body;
    },
  };
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.getUserByWallet.mockResolvedValue({
    wallet: WALLET,
    email: "u@example.com",
    kycStatus: "pending",
  });
  mocks.generateAccessToken.mockResolvedValue({ token: "sdk-token" });
  mocks.isApplicantFinalRejected.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/kyc/token — validation", () => {
  it("400s on a missing/invalid wallet", async () => {
    const res = await POST(makeReq({ connectedWallet: WALLET }));
    expect(res.status).toBe(400);
  });

  it("400s on a missing/invalid connectedWallet", async () => {
    const res = await POST(makeReq({ wallet: WALLET }));
    expect(res.status).toBe(400);
  });

  it("403s when the connected wallet is not authorized for the HL address", async () => {
    const other = "0x2222222222222222222222222222222222222222";
    mocks.getAuthorizedWalletsForHlAddress.mockResolvedValue([]);
    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: other }));
    expect(res.status).toBe(403);
  });
});

describe("POST /api/kyc/token — applicant lifecycle", () => {
  it("creates an applicant when none exists, then mints a token", async () => {
    mocks.getApplicant.mockResolvedValue(null);
    mocks.createApplicant.mockResolvedValue({ id: "app-new" });

    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: WALLET }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("sdk-token");

    expect(mocks.createApplicant).toHaveBeenCalledTimes(1);
    expect(mocks.updateKycStatus).toHaveBeenCalledWith(WALLET, {
      kycApplicantId: "app-new",
      kycStatus: "pending",
    });
    expect(mocks.resetApplicant).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).toHaveBeenCalledWith(WALLET);
  });

  it("reuses an existing, non-terminal applicant without resetting", async () => {
    mocks.getApplicant.mockResolvedValue({ id: "app-existing" });
    mocks.isApplicantFinalRejected.mockReturnValue(false);

    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: WALLET }));
    expect(res.status).toBe(200);
    expect(mocks.resetApplicant).not.toHaveBeenCalled();
    expect(mocks.createApplicant).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).toHaveBeenCalledWith(WALLET);
  });

  it("resets a FINAL-rejected applicant so the user can retry", async () => {
    // Regression for the "couldn't verify you" trap: a sticky FINAL rejection
    // must be reset (and status moved back to pending) before minting a token.
    mocks.getApplicant.mockResolvedValue({
      id: "app-dead",
      review: { reviewResult: { reviewAnswer: "RED", reviewRejectType: "FINAL" } },
    });
    mocks.isApplicantFinalRejected.mockReturnValue(true);

    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: WALLET }));
    expect(res.status).toBe(200);
    expect(mocks.resetApplicant).toHaveBeenCalledWith("app-dead");
    expect(mocks.updateKycStatus).toHaveBeenCalledWith(WALLET, {
      kycStatus: "pending",
    });
    // Existing applicant reused after reset — not recreated.
    expect(mocks.createApplicant).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).toHaveBeenCalledWith(WALLET);
  });

  it("returns 500 when a SumSub call throws", async () => {
    mocks.getApplicant.mockRejectedValue(new Error("sumsub down"));
    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: WALLET }));
    expect(res.status).toBe(500);
  });
});
