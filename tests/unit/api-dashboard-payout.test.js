import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gateway-stubs.js", () => ({
  STUB_ENABLED: false,
  stubPayout: { stub: true },
}));
vi.mock("@/lib/errors.js", () => ({
  reportCritical: vi.fn(),
}));

const { POST } = await import("@/app/api/dashboard/payout/route.js");

const VALID_HL = "0x1111111111111111111111111111111111111111";

function makeRequest(body) {
  return {
    async json() {
      if (typeof body === "string") {
        return JSON.parse(body);
      }
      return body;
    },
  };
}

const ORIGINAL_FETCH = global.fetch;
let originalEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  process.env.VALIDATOR_API_URL = "https://validator.test";
  process.env.VALIDATOR_API_KEY = "test-key";
  global.fetch = vi.fn();
});

afterEach(() => {
  process.env = originalEnv;
  global.fetch = ORIGINAL_FETCH;
});

describe("POST /api/dashboard/payout (public read)", () => {
  it("does NOT require any authentication headers", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", data: { payout: 0, checkpoints: [] } }),
    });
    const res = await POST(
      makeRequest({
        subaccount_uuid: "u-1",
        hl_address: VALID_HL,
        start_time_ms: 0,
        end_time_ms: 1,
      }),
    );
    expect(res.status).toBe(200);
  });

  it("returns 400 when the body is not JSON", async () => {
    const req = {
      async json() {
        throw new Error("bad json");
      },
    };
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Invalid JSON/);
  });

  it("returns 400 when subaccount_uuid is missing", async () => {
    const res = await POST(
      makeRequest({ hl_address: VALID_HL, start_time_ms: 0, end_time_ms: 1 }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/subaccount_uuid/);
  });

  it("returns 400 when hl_address is missing or invalid", async () => {
    const res = await POST(
      makeRequest({
        subaccount_uuid: "u-1",
        hl_address: "not-an-address",
        start_time_ms: 0,
        end_time_ms: 1,
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/hl_address/);
  });

  it("forwards the request to the validator with the expected body", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", data: { payout: 42, checkpoints: [] } }),
    });

    const res = await POST(
      makeRequest({
        subaccount_uuid: "u-42",
        hl_address: VALID_HL,
        start_time_ms: 100,
        end_time_ms: 200,
      }),
    );

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe("https://validator.test/entity/subaccount/payout");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toEqual({
      subaccount_uuid: "u-42",
      hl_address: VALID_HL,
      start_time_ms: 100,
      end_time_ms: 200,
    });
  });

  it("surfaces the validator's structured error body verbatim", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"error":"start_time_ms must be Monday 00:00:00 UTC"}',
    });

    const res = await POST(
      makeRequest({
        subaccount_uuid: "u-1",
        hl_address: VALID_HL,
        start_time_ms: 100,
        end_time_ms: 200,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("start_time_ms must be Monday 00:00:00 UTC");
    expect(body.validatorStatus).toBe(400);
  });

  it("treats validator 404 (no debt ledger data) as an empty success", async () => {
    // The validator returns 404 for both unknown UUIDs and brand-new
    // subaccounts without any checkpoints yet. Indistinguishable, so we
    // map both to a graceful empty-success payload.
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () =>
        '{"error":"Subaccount u-1 not found or has no debt ledger data"}',
    });
    const res = await POST(
      makeRequest({
        subaccount_uuid: "u-1",
        hl_address: VALID_HL,
        start_time_ms: 100,
        end_time_ms: 200,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data).toEqual({
      payout: 0,
      checkpoints: [],
      total_checkpoints: 0,
    });
    expect(body).not.toHaveProperty("error");
  });

  it("still surfaces validator 4xx that is NOT 404 as a real error", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"error":"end_time_ms must align to a 12-hour boundary"}',
    });
    const res = await POST(
      makeRequest({
        subaccount_uuid: "u-1",
        hl_address: VALID_HL,
        start_time_ms: 100,
        end_time_ms: 200,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("12-hour boundary");
  });

  it("maps validator 5xx to a 502 (so the gateway boundary is honest)", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => '{"error":"validator down"}',
    });
    const res = await POST(
      makeRequest({
        subaccount_uuid: "u-1",
        hl_address: VALID_HL,
        start_time_ms: 100,
        end_time_ms: 200,
      }),
    );
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain("validator down");
    expect(body.validatorStatus).toBe(503);
  });

  it("returns 502 when the validator fetch throws (network error)", async () => {
    global.fetch.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await POST(
      makeRequest({
        subaccount_uuid: "u-1",
        hl_address: VALID_HL,
        start_time_ms: 100,
        end_time_ms: 200,
      }),
    );
    expect(res.status).toBe(502);
  });

  it("returns 500 when VALIDATOR_API_URL is not configured", async () => {
    delete process.env.VALIDATOR_API_URL;
    const res = await POST(
      makeRequest({
        subaccount_uuid: "u-1",
        hl_address: VALID_HL,
        start_time_ms: 100,
        end_time_ms: 200,
      }),
    );
    expect(res.status).toBe(500);
  });
});
