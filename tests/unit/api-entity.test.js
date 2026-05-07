import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getAllMock = vi.fn();
vi.mock("@/lib/miners.js", () => ({
  getAllActiveMinersWithTiers: (...args) => getAllMock(...args),
}));

const { GET } = await import("@/app/api/entity/route.js");

beforeEach(() => {
  getAllMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/entity", () => {
  it("returns the active miners list as JSON", async () => {
    const sample = [
      { hotkey: "abc", slug: "vanta", isActive: true, tiers: [] },
      { hotkey: "def", slug: "jolly", isActive: true, tiers: [] },
    ];
    getAllMock.mockResolvedValue(sample);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(sample);
  });

  it("propagates errors from the data layer", async () => {
    getAllMock.mockRejectedValue(new Error("db down"));
    await expect(GET()).rejects.toThrow(/db down/);
  });
});
