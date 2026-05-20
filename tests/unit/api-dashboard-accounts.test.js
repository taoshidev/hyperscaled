import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Capture-then-resolve query chain. Tests prime the next query's result by
// calling `setRegistrationsResult([...])` (used by the main accounts query)
// or `setMinerLookup({hotkey})` (used by the optional miner-by-slug filter).
let pendingMinerLookup = null;
let pendingRegistrationsResult = [];

function makeDb() {
  return {
    select() {
      return {
        from() {
          return {
            // miner-by-slug lookup path:
            // db.select(...).from(entityMiners).where(...).limit(1) -> [miner|null]
            where() {
              return {
                limit: async () =>
                  pendingMinerLookup ? [pendingMinerLookup] : [],
              };
            },
            // registrations join path:
            // db.select(...).from(registrations).leftJoin(...).where(...).orderBy(...) -> rows[]
            leftJoin() {
              return {
                where() {
                  return {
                    orderBy: async () => pendingRegistrationsResult,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

const getDbMock = vi.fn();

vi.mock("@/lib/db", () => ({ getDb: (...args) => getDbMock(...args) }));

// We use sentinel column references — drizzle's `eq` / `or` / `sql` resolve them
// at runtime to plain JS values via the proxy returned by drizzle-orm. Our DB
// stub never actually inspects these, so identifiers are enough.
vi.mock("@/lib/db/schema", () => ({
  registrations: {
    id: "id",
    hlAddress: "hl_address",
    payerAddress: "payer_address",
    accountSize: "account_size",
    tierIndex: "tier_index",
    status: "status",
    createdAt: "created_at",
    minerHotkey: "miner_hotkey",
  },
  entityMiners: {
    hotkey: "hotkey",
    slug: "slug",
    name: "name",
  },
}));

vi.mock("@/lib/errors", () => ({ reportError: vi.fn() }));

const { GET } = await import("@/app/api/dashboard/accounts/route.js");

const PAYER = "0x5aeeff1126bd049e832af9ddae16c64050258e40";
const HL = "0x18cc85fec6c6a73634f5861ac2e4f2d1617a0844";

function makeReq(qs) {
  return new Request(`http://localhost/api/dashboard/accounts?${qs}`);
}

beforeEach(() => {
  pendingMinerLookup = null;
  pendingRegistrationsResult = [];
  getDbMock.mockReset().mockResolvedValue(makeDb());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/dashboard/accounts", () => {
  it("400s on missing wallet", async () => {
    const res = await GET(makeReq(""));
    expect(res.status).toBe(400);
  });

  it("400s on malformed wallet", async () => {
    const res = await GET(makeReq("wallet=not-an-address"));
    expect(res.status).toBe(400);
  });

  it("returns owner role when connected wallet IS the HL trader", async () => {
    pendingRegistrationsResult = [
      {
        id: 1,
        hlAddress: HL,
        payerAddress: HL, // single-wallet flow
        accountSize: 25000,
        tierIndex: 3,
        status: "registered",
        createdAt: new Date("2026-05-19T00:00:00Z"),
        minerHotkey: "hk-vanta",
        minerSlug: "vanta",
        minerName: "Vanta Trading",
      },
    ];
    const res = await GET(makeReq(`wallet=${HL}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accounts).toHaveLength(1);
    expect(body.accounts[0]).toMatchObject({
      hlAddress: HL,
      accountSize: 25000,
      role: "both",
      minerSlug: "vanta",
    });
    // Privacy: never expose the counterparty wallet to the requester.
    // Only `role` indicates the linkage type.
    expect(body.accounts[0]).not.toHaveProperty("payerAddress");
  });

  it("returns payer role for a dual-wallet payer (connected wallet ≠ HL)", async () => {
    pendingRegistrationsResult = [
      {
        id: 2,
        hlAddress: HL,
        payerAddress: PAYER,
        accountSize: 5000,
        tierIndex: 1,
        status: "registered",
        createdAt: new Date(),
        minerHotkey: "hk-vanta",
        minerSlug: "vanta",
        minerName: "Vanta Trading",
      },
    ];
    const res = await GET(makeReq(`wallet=${PAYER}`));
    const body = await res.json();
    expect(body.accounts).toHaveLength(1);
    expect(body.accounts[0]).toMatchObject({
      hlAddress: HL,
      role: "payer",
    });
    expect(body.accounts[0]).not.toHaveProperty("payerAddress");
  });

  it("collapses duplicate registrations of the same HL address (most-recent wins)", async () => {
    // Drizzle returns results ordered by createdAt DESC. Most recent first.
    pendingRegistrationsResult = [
      {
        id: 9,
        hlAddress: HL,
        payerAddress: PAYER,
        accountSize: 10000,
        tierIndex: 2,
        status: "registered",
        createdAt: new Date("2026-05-19"),
        minerHotkey: "hk-vanta",
        minerSlug: "vanta",
        minerName: "Vanta Trading",
      },
      {
        id: 1,
        hlAddress: HL,
        payerAddress: PAYER,
        accountSize: 5000, // older — should be dropped
        tierIndex: 1,
        status: "registered",
        createdAt: new Date("2026-04-01"),
        minerHotkey: "hk-vanta",
        minerSlug: "vanta",
        minerName: "Vanta Trading",
      },
    ];
    const res = await GET(makeReq(`wallet=${PAYER}`));
    const body = await res.json();
    expect(body.accounts).toHaveLength(1);
    expect(body.accounts[0].accountSize).toBe(10000);
  });

  it("returns empty list when nothing matches (production intro path)", async () => {
    pendingRegistrationsResult = [];
    const res = await GET(makeReq(`wallet=${PAYER}`));
    const body = await res.json();
    expect(body.accounts).toEqual([]);
  });

  it("returns empty list when miner slug is unknown (no DB scan)", async () => {
    pendingMinerLookup = null;
    const res = await GET(makeReq(`wallet=${PAYER}&miner=ghost`));
    const body = await res.json();
    expect(body.accounts).toEqual([]);
  });

  it("filters by miner slug when provided", async () => {
    pendingMinerLookup = { hotkey: "hk-vanta" };
    pendingRegistrationsResult = [
      {
        id: 3,
        hlAddress: HL,
        payerAddress: PAYER,
        accountSize: 100000,
        tierIndex: 5,
        status: "registered",
        createdAt: new Date(),
        minerHotkey: "hk-vanta",
        minerSlug: "vanta",
        minerName: "Vanta Trading",
      },
    ];
    const res = await GET(makeReq(`wallet=${PAYER}&miner=vanta`));
    const body = await res.json();
    expect(body.accounts).toHaveLength(1);
    expect(body.accounts[0].minerSlug).toBe("vanta");
  });

  it("normalizes wallets to lowercase regardless of input casing", async () => {
    // Checksum-cased wallet (typical display format from wagmi/RainbowKit).
    const payerChecksum = "0x5aEeFF1126bd049E832AF9dDae16c64050258e40";
    const hlChecksum = "0x18cc85FeC6C6a73634F5861Ac2E4f2D1617a0844";
    pendingRegistrationsResult = [
      {
        id: 4,
        hlAddress: hlChecksum,
        payerAddress: payerChecksum,
        accountSize: 1000,
        tierIndex: 0,
        status: "registered",
        createdAt: new Date(),
        minerHotkey: "hk-vanta",
        minerSlug: "vanta",
        minerName: "Vanta Trading",
      },
    ];
    const res = await GET(makeReq(`wallet=${payerChecksum}`));
    const body = await res.json();
    expect(body.accounts[0].hlAddress).toBe(HL);
    expect(body.accounts[0]).not.toHaveProperty("payerAddress");
  });
});
