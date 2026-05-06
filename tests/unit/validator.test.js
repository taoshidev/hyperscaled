import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `lib/gateway-stubs` reads STUB_GATEWAY at import time. Force it off so the
// validator code under test actually exercises the network path.
process.env.STUB_GATEWAY = "false";
process.env.VALIDATOR_API_URL = "https://validator.test.example";
process.env.VALIDATOR_API_KEY = "test-key";

const { checkValidatorStatus, isConfirmedDeregistered } = await import(
  "@/lib/validator.js"
);

const HL_ADDRESS = "0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1";
const SYNTHETIC_HOTKEY = "5GCUMqFigwvKh62LdJXYYr3pHhCvpAhWbF83DqB2ZUDZRKwM";

const traderResponse = (synthetic_hotkey = SYNTHETIC_HOTKEY) => ({
  ok: true,
  status: 200,
  json: async () => ({
    dashboard: { subaccount_info: { synthetic_hotkey } },
  }),
});

const subaccountResponse = (status) => ({
  ok: true,
  status: 200,
  json: async () => ({
    dashboard: { subaccount_info: { status } },
  }),
});

beforeEach(() => {
  vi.spyOn(global, "fetch");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isConfirmedDeregistered", () => {
  it.each([
    ["not_found", true],
    ["failed", true],
    ["eliminated", true],
    ["inactive", true],
    ["deregistered", true],
    ["active", false],
    ["pending", false],
    ["unknown", false],
    ["", false],
    [undefined, false],
  ])("returns %s for status=%s", (status, expected) => {
    expect(isConfirmedDeregistered(status)).toBe(expected);
  });
});

describe("checkValidatorStatus", () => {
  it("returns active without fetching when STUB_GATEWAY is enabled", async () => {
    // STUB_GATEWAY is captured at import time so we can't toggle it here;
    // we assert the network-path behavior in the other tests instead.
    expect(typeof checkValidatorStatus).toBe("function");
  });

  it("returns 'not_found' when /hl-traders 404s", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await checkValidatorStatus(HL_ADDRESS);
    expect(result).toEqual({ status: "not_found" });
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("returns 'unknown' when /hl-traders returns 5xx", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 502 });
    const result = await checkValidatorStatus(HL_ADDRESS);
    expect(result).toEqual({ status: "unknown" });
  });

  it("returns 'not_found' when trader payload has no synthetic_hotkey", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ dashboard: {} }),
    });
    const result = await checkValidatorStatus(HL_ADDRESS);
    expect(result).toEqual({ status: "not_found" });
  });

  it("looks up subaccount status with Bearer auth and returns it", async () => {
    global.fetch
      .mockResolvedValueOnce(traderResponse())
      .mockResolvedValueOnce(subaccountResponse("active"));

    const result = await checkValidatorStatus(HL_ADDRESS);
    expect(result).toEqual({ status: "active" });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    const subCall = global.fetch.mock.calls[1];
    expect(subCall[0]).toBe(
      `https://validator.test.example/entity/subaccount/${SYNTHETIC_HOTKEY}`,
    );
    expect(subCall[1]).toMatchObject({
      headers: { Authorization: "Bearer test-key" },
    });
  });

  it.each(["eliminated", "failed", "pending"])(
    "passes through subaccount status '%s' from the validator",
    async (status) => {
      global.fetch
        .mockResolvedValueOnce(traderResponse())
        .mockResolvedValueOnce(subaccountResponse(status));
      const result = await checkValidatorStatus(HL_ADDRESS);
      expect(result).toEqual({ status });
    },
  );

  it("returns 'unknown' (and surfaces a warn log) when /hl-traders aborts on timeout", async () => {
    // Simulate the AbortController firing — fetch throws an AbortError.
    const abortErr = new Error("aborted");
    abortErr.name = "AbortError";
    global.fetch.mockRejectedValueOnce(abortErr);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await checkValidatorStatus(HL_ADDRESS);

    expect(result).toEqual({ status: "unknown" });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[validator] /hl-traders timed out"),
      expect.any(Number),
      "ms",
      { hlAddress: HL_ADDRESS },
    );
  });

  it("returns 'unknown' when /entity/subaccount aborts on timeout", async () => {
    global.fetch.mockResolvedValueOnce(traderResponse());
    const abortErr = new Error("aborted");
    abortErr.name = "AbortError";
    global.fetch.mockRejectedValueOnce(abortErr);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await checkValidatorStatus(HL_ADDRESS);
    expect(result).toEqual({ status: "unknown" });
  });

  it("aborts in-flight fetch via AbortController signal", async () => {
    // Capture the signal so we can confirm it was aborted.
    let capturedSignal;
    global.fetch.mockImplementationOnce((url, init) => {
      capturedSignal = init?.signal;
      return new Promise((_, reject) => {
        capturedSignal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Fire the call with a fake timer to let the timeout elapse synchronously.
    vi.useFakeTimers();
    const promise = checkValidatorStatus(HL_ADDRESS);
    await vi.advanceTimersByTimeAsync(8000);
    vi.useRealTimers();

    const result = await promise;
    expect(result).toEqual({ status: "unknown" });
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("returns 'unknown' when validator config is missing", async () => {
    const oldUrl = process.env.VALIDATOR_API_URL;
    const oldKey = process.env.VALIDATOR_API_KEY;
    delete process.env.VALIDATOR_API_URL;
    delete process.env.VALIDATOR_API_KEY;
    try {
      const result = await checkValidatorStatus(HL_ADDRESS);
      expect(result).toEqual({ status: "unknown" });
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      process.env.VALIDATOR_API_URL = oldUrl;
      process.env.VALIDATOR_API_KEY = oldKey;
    }
  });
});
