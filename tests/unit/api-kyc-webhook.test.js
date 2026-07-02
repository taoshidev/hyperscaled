import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The webhook resolves users by wallet and verifies the SumSub HMAC. We mock
// both so the test focuses on routing/branching, not crypto or the DB.
const verifyMock = vi.fn();
const updateKycStatusMock = vi.fn();

vi.mock("@/lib/sumsub.js", () => ({
  verifyWebhookSignature: (...args) => verifyMock(...args),
  updateKycStatus: (...args) => updateKycStatusMock(...args),
}));

const reportErrorMock = vi.fn();
const reportWarningMock = vi.fn();
vi.mock("@/lib/errors", () => ({
  reportError: (...args) => reportErrorMock(...args),
  reportWarning: (...args) => reportWarningMock(...args),
}));

const { POST } = await import("@/app/api/kyc/webhook/route.js");

const WALLET = "0x1111111111111111111111111111111111111111";
// A vanta-ui / hyperscaled-api applicant id (users.id). This is the exact shape
// that showed up in prod ("... where wallet = 'c04febbb-...'") and must NOT
// trigger a DB write here.
const UUID = "c04febbb-d494-4bc3-af0f-b0480a5a23e4";

function makeRequest(payload, { digest = "digest", alg = "HMAC_SHA256_HEX" } = {}) {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  return {
    async text() {
      return raw;
    },
    headers: {
      get(name) {
        const n = String(name).toLowerCase();
        if (n === "x-payload-digest") return digest;
        if (n === "x-payload-digest-alg") return alg;
        return null;
      },
    },
  };
}

beforeEach(() => {
  verifyMock.mockReset().mockReturnValue(true);
  updateKycStatusMock.mockReset().mockResolvedValue(1);
  reportErrorMock.mockReset();
  reportWarningMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/kyc/webhook — signature + payload gating", () => {
  it("returns 403 when the signature is invalid", async () => {
    verifyMock.mockReturnValue(false);
    const res = await POST(
      makeRequest({ type: "applicantReviewed", externalUserId: WALLET }),
    );
    expect(res.status).toBe(403);
    expect(updateKycStatusMock).not.toHaveBeenCalled();
  });

  it("returns 403 when the digest header is missing", async () => {
    const res = await POST(
      makeRequest(
        { type: "applicantReviewed", externalUserId: WALLET },
        { digest: null },
      ),
    );
    expect(res.status).toBe(403);
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("returns 400 on malformed JSON (with a valid signature)", async () => {
    const res = await POST(makeRequest("this is not json{"));
    expect(res.status).toBe(400);
    expect(updateKycStatusMock).not.toHaveBeenCalled();
  });

  it("acknowledges (200) events with no externalUserId without touching the DB", async () => {
    const res = await POST(makeRequest({ type: "applicantReviewed" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(updateKycStatusMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/kyc/webhook — cross-app (UUID) events are ignored", () => {
  // Regression for the prod bug: UUID externalUserIds belong to sibling apps on
  // the shared SumSub project. Running UPDATE ... WHERE wallet = '<uuid>' either
  // matched nobody or threw; either way it must not happen here.
  it("ignores a UUID externalUserId and never writes to the DB", async () => {
    const res = await POST(
      makeRequest({
        type: "applicantReviewed",
        externalUserId: UUID,
        reviewResult: { reviewAnswer: "GREEN" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, ignored: true });
    expect(updateKycStatusMock).not.toHaveBeenCalled();
    expect(reportErrorMock).not.toHaveBeenCalled();
    expect(reportWarningMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/kyc/webhook — status transitions for wallet applicants", () => {
  it("marks GREEN review as approved with a verified timestamp", async () => {
    const res = await POST(
      makeRequest({
        type: "applicantReviewed",
        externalUserId: WALLET,
        reviewResult: { reviewAnswer: "GREEN" },
      }),
    );
    expect(res.status).toBe(200);
    expect(updateKycStatusMock).toHaveBeenCalledTimes(1);
    const [wallet, fields] = updateKycStatusMock.mock.calls[0];
    expect(wallet).toBe(WALLET);
    expect(fields.kycStatus).toBe("approved");
    expect(fields.kycVerifiedAt).toBeInstanceOf(Date);
  });

  it("marks RED review as rejected", async () => {
    const res = await POST(
      makeRequest({
        type: "applicantReviewed",
        externalUserId: WALLET,
        reviewResult: { reviewAnswer: "RED", reviewRejectType: "FINAL" },
      }),
    );
    expect(res.status).toBe(200);
    expect(updateKycStatusMock).toHaveBeenCalledWith(WALLET, {
      kycStatus: "rejected",
    });
  });

  it("marks applicantPending as pending", async () => {
    const res = await POST(
      makeRequest({ type: "applicantPending", externalUserId: WALLET }),
    );
    expect(res.status).toBe(200);
    expect(updateKycStatusMock).toHaveBeenCalledWith(WALLET, {
      kycStatus: "pending",
    });
  });

  it("treats applicantOnHold as pending", async () => {
    const res = await POST(
      makeRequest({ type: "applicantOnHold", externalUserId: WALLET }),
    );
    expect(res.status).toBe(200);
    expect(updateKycStatusMock).toHaveBeenCalledWith(WALLET, {
      kycStatus: "pending",
    });
  });

  it("acknowledges unhandled event types without a DB write or warning", async () => {
    const res = await POST(
      makeRequest({ type: "applicantCreated", externalUserId: WALLET }),
    );
    expect(res.status).toBe(200);
    expect(updateKycStatusMock).not.toHaveBeenCalled();
    expect(reportWarningMock).not.toHaveBeenCalled();
  });

  it("acknowledges an applicantReviewed with a non-terminal answer without writing", async () => {
    const res = await POST(
      makeRequest({
        type: "applicantReviewed",
        externalUserId: WALLET,
        reviewResult: { reviewAnswer: "YELLOW" },
      }),
    );
    expect(res.status).toBe(200);
    expect(updateKycStatusMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/kyc/webhook — observability + retry semantics", () => {
  it("warns (but still 200s) when a handled event matches no local user", async () => {
    updateKycStatusMock.mockResolvedValue(0); // wallet has no user row yet
    const res = await POST(
      makeRequest({
        type: "applicantReviewed",
        externalUserId: WALLET,
        reviewResult: { reviewAnswer: "GREEN" },
      }),
    );
    expect(res.status).toBe(200);
    expect(reportWarningMock).toHaveBeenCalledTimes(1);
    expect(reportErrorMock).not.toHaveBeenCalled();
  });

  it("returns 500 (so SumSub retries) when the DB write throws", async () => {
    // Regression: the old handler swallowed this as 200, so a transient DB
    // failure permanently stranded the user on "pending" (SumSub never retried).
    updateKycStatusMock.mockRejectedValue(new Error("db down"));
    const res = await POST(
      makeRequest({
        type: "applicantReviewed",
        externalUserId: WALLET,
        reviewResult: { reviewAnswer: "GREEN" },
      }),
    );
    expect(res.status).toBe(500);
    expect(reportErrorMock).toHaveBeenCalledTimes(1);
  });
});
