import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Allowlist test for the public `/api/entity` payload shape.
 *
 * `getAllActiveMinersWithTiers` is the sole input to `GET /api/entity`,
 * which is unauthenticated. This test pins the field set so that a
 * regression like re-adding `apiKey` or `apiUrl` to the SELECT or the
 * result-shape causes CI to fail loudly.
 *
 * If you intentionally add a field to the public catalog, update the
 * `ALLOWED_MINER_KEYS` / `ALLOWED_TIER_KEYS` arrays below AND audit
 * whether it is safe to expose.
 */
const ALLOWED_MINER_KEYS = [
  "hotkey",
  "name",
  "slug",
  "usdcWallet",
  "color",
  "payoutCadenceDays",
  "tiers",
];

const ALLOWED_TIER_KEYS = [
  "accountSize",
  "priceUsdc",
  "profitSplit",
  "label",
];

const FORBIDDEN_MINER_KEYS = [
  "apiKey",
  "apiUrl",
  "createdAt",
  "updatedAt",
  "isActive",
];

function buildDbMock(rows) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ orderBy });
  const leftJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ leftJoin });
  const select = vi.fn().mockReturnValue({ from });
  return { select };
}

let currentRows = [];
vi.mock("@/lib/db", () => ({
  getDb: async () => buildDbMock(currentRows),
}));

const { getAllActiveMinersWithTiers } = await import("@/lib/miners.js");

const sampleRow = (overrides) => ({
  hotkey: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  name: "Vanta Trading",
  slug: "vanta",
  usdcWallet: "0xBab75f99F42A575Af937cD1c25E851C2cc42D42d",
  color: "#3b82f6",
  payoutCadenceDays: 7,
  accountSize: 25000,
  priceUsdc: "119.00",
  profitSplit: 100,
  ...overrides,
});

async function loadMinersWithRows(rows) {
  currentRows = rows;
  return { getAllActiveMinersWithTiers };
}

describe("getAllActiveMinersWithTiers public shape", () => {
  beforeEach(() => {
    currentRows = [];
  });

  it("returns an entry for a miner with no tiers and an empty tiers array", async () => {
    const { getAllActiveMinersWithTiers } = await loadMinersWithRows([
      sampleRow({ accountSize: null, priceUsdc: null, profitSplit: null }),
    ]);
    const result = await getAllActiveMinersWithTiers();

    expect(result).toHaveLength(1);
    expect(result[0].tiers).toEqual([]);
  });

  it("returns only allowlisted miner-level fields", async () => {
    const { getAllActiveMinersWithTiers } = await loadMinersWithRows([
      sampleRow(),
    ]);
    const result = await getAllActiveMinersWithTiers();

    expect(result).toHaveLength(1);
    const miner = result[0];
    expect(Object.keys(miner).sort()).toEqual([...ALLOWED_MINER_KEYS].sort());
    for (const forbidden of FORBIDDEN_MINER_KEYS) {
      expect(miner).not.toHaveProperty(forbidden);
    }
  });

  it("returns only allowlisted tier-level fields", async () => {
    const { getAllActiveMinersWithTiers } = await loadMinersWithRows([
      sampleRow(),
    ]);
    const [miner] = await getAllActiveMinersWithTiers();

    expect(miner.tiers).toHaveLength(1);
    expect(Object.keys(miner.tiers[0]).sort()).toEqual(
      [...ALLOWED_TIER_KEYS].sort(),
    );
  });
});
