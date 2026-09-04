import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/errors", () => ({
  reportError: vi.fn(),
  reportCritical: vi.fn(),
  reportWarning: vi.fn(),
  flushErrors: vi.fn(),
  SEVERITY: { ERROR: "error", WARNING: "warning", CRITICAL: "critical" },
}));

vi.mock("@/lib/auth/command-center.js", () => ({
  requireCommandCenterStaff: async () => ({ wallet: "0xstaff", role: "admin", label: "Staff" }),
}));

vi.mock("@/lib/db/index.js", () => ({ getDb: async () => ({}) }));

const retryMock = vi.fn();
vi.mock("@/lib/registrations/retry-pending", () => ({
  RETRY_ALREADY_RUNNING: "retry_already_running",
  retryPendingRegistrations: (...args) => retryMock(...args),
}));

import { retryRegistrations } from "@/app/actions/registrations";

describe("retryRegistrations action", () => {
  beforeEach(() => {
    retryMock.mockReset();
    retryMock.mockResolvedValue({ ok: true, retried: 0, results: [], budgetExhausted: false });
  });

  it("retries everything when no ids are given, tagged with the staff wallet", async () => {
    const result = await retryRegistrations();
    expect(result.success).toBe(true);
    expect(retryMock.mock.calls[0][1]).toMatchObject({ ids: null, actor: "0xstaff", source: "command-center/registrations" });
  });

  it("rejects a non-array selection", async () => {
    expect(await retryRegistrations({ ids: "980" })).toEqual({ success: false, error: "Invalid selection." });
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized selection before touching the database", async () => {
    const ids = Array.from({ length: 501 }, (_, i) => i + 1);
    expect(await retryRegistrations({ ids })).toEqual({ success: false, error: "Too many registrations selected." });
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("drops out-of-range, non-integer and duplicate ids", async () => {
    await retryRegistrations({ ids: [980, "980", 2147483648, "1e20", -1, 0, 1.5, "abc", 981] });
    expect(retryMock.mock.calls[0][1].ids).toEqual([980, 981]);
  });

  it("errors when nothing valid is selected", async () => {
    expect(await retryRegistrations({ ids: [2147483648, "x"] })).toEqual({
      success: false,
      error: "No registrations selected.",
    });
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("explains a busy lock instead of surfacing the raw code", async () => {
    retryMock.mockResolvedValue({ ok: false, error: "retry_already_running" });
    const result = await retryRegistrations({ ids: [980] });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already in progress/);
  });

  it("passes other library errors through", async () => {
    retryMock.mockResolvedValue({ ok: false, error: "Failed to load pending registrations" });
    expect(await retryRegistrations()).toEqual({ success: false, error: "Failed to load pending registrations" });
  });

  it("never throws into the page: unexpected exceptions become a result", async () => {
    retryMock.mockRejectedValue(new Error("boom"));
    expect(await retryRegistrations()).toEqual({ success: false, error: "Retry failed unexpectedly. Check logs." });
  });

  it("returns results and the budget flag on success", async () => {
    retryMock.mockResolvedValue({ ok: true, retried: 1, results: [{ id: 980, status: "registered" }], budgetExhausted: true });
    expect(await retryRegistrations({ ids: [980] })).toEqual({
      success: true,
      retried: 1,
      results: [{ id: 980, status: "registered" }],
      budgetExhausted: true,
    });
  });
});
