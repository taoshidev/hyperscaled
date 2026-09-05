import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/errors", () => ({
  reportError: vi.fn(),
  reportCritical: vi.fn(),
  reportWarning: vi.fn(),
  flushErrors: vi.fn(),
  SEVERITY: { ERROR: "error", WARNING: "warning", CRITICAL: "critical" },
}));

vi.mock("@/lib/db", () => ({ getDb: async () => ({}) }));

const retryMock = vi.fn();
vi.mock("@/lib/registrations/retry-pending", () => ({
  RETRY_ALREADY_RUNNING: "retry_already_running",
  retryPendingRegistrations: (...args) => retryMock(...args),
}));

import { GET, POST } from "@/app/api/register/retry/route";

function req(method, bearer) {
  const headers = bearer ? { authorization: `Bearer ${bearer}` } : {};
  return new Request("http://localhost/api/register/retry", { method, headers });
}

describe("/api/register/retry auth", () => {
  const savedRetry = process.env.RETRY_SECRET;
  const savedCron = process.env.CRON_SECRET;

  beforeEach(() => {
    retryMock.mockReset();
    retryMock.mockResolvedValue({ ok: true, retried: 0, results: [], budgetExhausted: false });
    process.env.RETRY_SECRET = "retry-secret-value";
    process.env.CRON_SECRET = "cron-secret-value";
  });

  afterEach(() => {
    if (savedRetry === undefined) delete process.env.RETRY_SECRET;
    else process.env.RETRY_SECRET = savedRetry;
    if (savedCron === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = savedCron;
  });

  it("returns 500 when neither secret is configured", async () => {
    delete process.env.RETRY_SECRET;
    delete process.env.CRON_SECRET;
    const res = await POST(req("POST", "anything"));
    expect(res.status).toBe(500);
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("rejects a missing bearer", async () => {
    const res = await POST(req("POST"));
    expect(res.status).toBe(401);
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("rejects a wrong bearer", async () => {
    const res = await GET(req("GET", "nope"));
    expect(res.status).toBe(401);
    expect(retryMock).not.toHaveBeenCalled();
  });

  it("accepts RETRY_SECRET on POST (manual / CLI)", async () => {
    const res = await POST(req("POST", "retry-secret-value"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ retried: 0, results: [], budgetExhausted: false });
    expect(retryMock).toHaveBeenCalledTimes(1);
    expect(retryMock.mock.calls[0][1]).toMatchObject({ source: "api/register/retry", actor: "bearer" });
  });

  it("accepts CRON_SECRET on GET (Vercel cron)", async () => {
    const res = await GET(req("GET", "cron-secret-value"));
    expect(res.status).toBe(200);
    expect(retryMock).toHaveBeenCalledTimes(1);
    expect(retryMock.mock.calls[0][1]).toMatchObject({ actor: "cron" });
  });

  it("accepts RETRY_SECRET on GET as well", async () => {
    const res = await GET(req("GET", "retry-secret-value"));
    expect(res.status).toBe(200);
  });

  it("still works when only CRON_SECRET is configured", async () => {
    delete process.env.RETRY_SECRET;
    const res = await GET(req("GET", "cron-secret-value"));
    expect(res.status).toBe(200);
  });

  it("surfaces a load failure as 500", async () => {
    retryMock.mockResolvedValue({ ok: false, error: "Failed to load pending registrations" });
    const res = await POST(req("POST", "retry-secret-value"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to load pending registrations" });
  });

  it("answers 409 when another run holds the lock", async () => {
    retryMock.mockResolvedValue({ ok: false, error: "retry_already_running" });
    const res = await GET(req("GET", "cron-secret-value"));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "A retry run is already in progress" });
  });

  it("passes results through", async () => {
    retryMock.mockResolvedValue({
      ok: true,
      retried: 1,
      results: [{ id: 980, status: "registered" }],
      budgetExhausted: true,
    });
    const res = await POST(req("POST", "retry-secret-value"));
    expect(await res.json()).toEqual({
      retried: 1,
      results: [{ id: 980, status: "registered" }],
      budgetExhausted: true,
    });
  });
});
