import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getRegistrationCapacitySnapshotMock = vi.fn();
const reportErrorMock = vi.fn();

vi.mock("@/lib/registration-capacity", () => ({
  getRegistrationCapacitySnapshot: (...args) =>
    getRegistrationCapacitySnapshotMock(...args),
}));

vi.mock("@/lib/errors", () => ({
  reportError: (...args) => reportErrorMock(...args),
}));

const { GET } = await import("@/app/api/register/capacity/route.js");

beforeEach(() => {
  getRegistrationCapacitySnapshotMock.mockReset();
  reportErrorMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/register/capacity", () => {
  it("returns snapshot JSON and short public cache headers", async () => {
    const snapshot = {
      free: { current: 3, max: 100, atCapacity: false },
      paid: { current: 1, max: 500, atCapacity: false },
    };
    getRegistrationCapacitySnapshotMock.mockResolvedValue(snapshot);

    const res = await GET(new Request("http://localhost/api/register/capacity"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(snapshot);
    expect(res.headers.get("Cache-Control")).toMatch(/max-age=30/);
  });

  it("fails open with zero counts when the snapshot throws", async () => {
    getRegistrationCapacitySnapshotMock.mockRejectedValue(new Error("db down"));

    const res = await GET(new Request("http://localhost/api/register/capacity"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      free: { current: 0, max: null, atCapacity: false },
      paid: { current: 0, max: null, atCapacity: false },
    });
    expect(reportErrorMock).toHaveBeenCalled();
  });
});
