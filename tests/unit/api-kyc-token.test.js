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

const checkValidatorStatus = vi.fn();
vi.mock("@/lib/validator", () => ({
  checkValidatorStatus: (...a) => checkValidatorStatus(...a),
}));

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
  // Default: an existing trader with a registration row for this HL address.
  mocks.getAuthorizedWalletsForHlAddress.mockResolvedValue([WALLET]);
  checkValidatorStatus.mockReset();
  checkValidatorStatus.mockResolvedValue({ status: "not_found" });
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

describe("POST /api/kyc/token — registrations closed (Notion #1560)", () => {
  it("refuses an address with no registration that the validator has never seen", async () => {
    mocks.getAuthorizedWalletsForHlAddress.mockResolvedValue([]);
    mocks.getUserByWallet.mockResolvedValue(null);
    checkValidatorStatus.mockResolvedValue({ status: "not_found" });

    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: WALLET }));
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.code).toBe("REGISTRATIONS_CLOSED");
    expect(body.error).toMatch(/^Hyperscaled is no longer accepting new accounts\./);
    expect(mocks.createUserByWallet).not.toHaveBeenCalled();
    expect(mocks.createApplicant).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).not.toHaveBeenCalled();
  });

  it("keeps KYC for an account the validator knows but this app never registered", async () => {
    mocks.getAuthorizedWalletsForHlAddress.mockResolvedValue([]);
    checkValidatorStatus.mockResolvedValue({ status: "active" });
    mocks.getApplicant.mockResolvedValue({ id: "app-existing" });

    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: WALLET }));
    expect(res.status).toBe(200);
    expect(checkValidatorStatus).toHaveBeenCalledWith(WALLET);
  });

  it("keeps KYC for an eliminated account (it may still be owed rewards)", async () => {
    mocks.getAuthorizedWalletsForHlAddress.mockResolvedValue([]);
    checkValidatorStatus.mockResolvedValue({ status: "eliminated" });
    mocks.getApplicant.mockResolvedValue({ id: "app-existing" });

    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: WALLET }));
    expect(res.status).toBe(200);
  });

  it("fails open when the validator is unreachable", async () => {
    mocks.getAuthorizedWalletsForHlAddress.mockResolvedValue([]);
    checkValidatorStatus.mockResolvedValue({ status: "unknown" });
    mocks.getApplicant.mockResolvedValue({ id: "app-existing" });

    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: WALLET }));
    expect(res.status).toBe(200);
  });

  it("does not consult the validator when a registration row exists", async () => {
    mocks.getApplicant.mockResolvedValue({ id: "app-existing" });

    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: WALLET }));
    expect(res.status).toBe(200);
    expect(checkValidatorStatus).not.toHaveBeenCalled();
  });

  it("reuses the authorization lookup for a secondary wallet instead of querying twice", async () => {
    const payer = "0x3333333333333333333333333333333333333333";
    mocks.getAuthorizedWalletsForHlAddress.mockResolvedValue([WALLET, payer]);
    mocks.getApplicant.mockResolvedValue({ id: "app-existing" });

    const res = await POST(makeReq({ wallet: WALLET, connectedWallet: payer }));
    expect(res.status).toBe(200);
    expect(mocks.getAuthorizedWalletsForHlAddress).toHaveBeenCalledTimes(1);
    expect(checkValidatorStatus).not.toHaveBeenCalled();
  });
});
