/**
 * Coverage for `deleteUnredeemedCoupons` — the bulk-delete server action.
 *
 * The previous implementation:
 *   - SELECT every coupon id (potentially millions of rows into Node).
 *   - SELECT every redemption coupon-id (same).
 *   - Compute the set difference in JS.
 *   - DELETE WHERE id IN (huge array).
 *
 * The fix:
 *   - Push the diff into Postgres via `WHERE NOT EXISTS (…)`.
 *   - Apply a per-call hard cap (`MAX_DELETE_UNREDEEMED_PER_CALL`) so a
 *     single click can never lock the table.
 *   - Surface a `dryRun` mode so the toolbar can confirm against the
 *     real candidate count before the destructive call.
 *
 * These tests pin both the contract of the new shape and that the action
 * never falls back to "load all rows into JS".
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted-safe schema mock — the action uses these as opaque drizzle table
// references; the fake db identifies them by `__name`.
vi.mock("@/lib/db/schema.js", () => ({
  coupons: { __name: "coupons", id: "coupons.id" },
  couponRedemptions: {
    __name: "couponRedemptions",
    couponId: "couponRedemptions.couponId",
  },
  users: { __name: "users", id: "users.id" },
  entityMiners: { __name: "entityMiners" },
  entityTiers: { __name: "entityTiers" },
}));

// drizzle-orm helpers are opaque markers in the action; the fake db
// observes which builder methods get called rather than evaluating SQL.
vi.mock("drizzle-orm", () => ({
  eq: (...args) => ({ __op: "eq", args }),
  and: (...args) => ({ __op: "and", args }),
  desc: (x) => ({ __op: "desc", x }),
  asc: (x) => ({ __op: "asc", x }),
  inArray: (col, src) => ({ __op: "inArray", col, src }),
  count: () => ({ __op: "count" }),
  sql: (strings, ...values) => ({ __op: "sql", strings, values }),
  ilike: (...args) => ({ __op: "ilike", args }),
  notExists: (sub) => ({ __op: "notExists", sub }),
}));

// Auth gate — every successful test must call this exactly once.
const requireStaffMock = vi.fn();
vi.mock("@/lib/auth/command-center.js", () => ({
  requireCommandCenterStaff: (...args) => requireStaffMock(...args),
}));

// admin/command-center-sort isn't exercised by the delete action but the
// module imports it at the top level.
vi.mock("@/lib/admin/command-center-sort.js", () => ({
  parseAdminSort: vi.fn(),
}));

// Configurable per-test handles into the fake db.
let candidateCountValue = 0;
let deletedRowsValue = [];
const recordedCalls = [];

function makeFakeDb() {
  const db = {
    select: (cols) => ({
      from: (table) => {
        const ctx = { table, cols, where: null, limit: null };
        return {
          where: (cond) => {
            ctx.where = cond;
            const result = {
              limit: (n) => {
                ctx.limit = n;
                recordedCalls.push({ kind: "select.limit", ctx: { ...ctx } });
                return ctx;
              },
            };
            // Make the where(...) result thenable so awaiting it returns
            // canned [{ c: candidateCount }] for the count query.
            result.then = (resolve, reject) =>
              Promise.resolve(resolveSelect(ctx)).then(resolve, reject);
            return result;
          },
        };
      },
    }),
    delete: (table) => ({
      where: (cond) => ({
        returning: async () => {
          recordedCalls.push({ kind: "delete", table, where: cond });
          return deletedRowsValue;
        },
      }),
    }),
  };
  return db;
}

function resolveSelect(ctx) {
  recordedCalls.push({ kind: "select.await", ctx: { ...ctx } });
  if (ctx.cols && ctx.cols.c !== undefined) {
    return [{ c: candidateCountValue }];
  }
  return [];
}

vi.mock("@/lib/db/index.js", () => ({
  getDb: async () => makeFakeDb(),
}));

const { deleteUnredeemedCoupons } = await import("@/app/actions/coupons.js");

beforeEach(() => {
  requireStaffMock.mockReset();
  requireStaffMock.mockResolvedValue({ wallet: "0xstaff" });
  candidateCountValue = 0;
  deletedRowsValue = [];
  recordedCalls.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("deleteUnredeemedCoupons — dry run", () => {
  it("returns the candidate count without performing a delete", async () => {
    candidateCountValue = 42;

    const result = await deleteUnredeemedCoupons({ dryRun: true });

    expect(result).toMatchObject({
      success: true,
      dryRun: true,
      candidateCount: 42,
    });
    expect(result.maxPerCall).toBeGreaterThan(0);
    // No delete() should have been issued in dry-run mode.
    expect(recordedCalls.some((c) => c.kind === "delete")).toBe(false);
  });

  it("requires command-center staff authentication", async () => {
    requireStaffMock.mockRejectedValueOnce(new Error("forbidden"));
    await expect(
      deleteUnredeemedCoupons({ dryRun: true }),
    ).rejects.toThrow("forbidden");
  });
});

describe("deleteUnredeemedCoupons — real delete", () => {
  it("returns deletedCount=0 when no candidates exist", async () => {
    candidateCountValue = 0;
    deletedRowsValue = [];

    const result = await deleteUnredeemedCoupons();

    expect(result).toMatchObject({
      success: true,
      deletedCount: 0,
      candidateCount: 0,
      remainingCandidateCount: 0,
    });
    // Skip the destructive call entirely when there's nothing to do.
    expect(recordedCalls.some((c) => c.kind === "delete")).toBe(false);
  });

  it("issues a single bounded delete and reports counts", async () => {
    candidateCountValue = 12;
    deletedRowsValue = Array.from({ length: 12 }, (_, i) => ({
      id: `c-${i}`,
    }));

    const result = await deleteUnredeemedCoupons();

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(12);
    expect(result.candidateCount).toBe(12);
    expect(result.remainingCandidateCount).toBe(0);

    // Exactly one DELETE should be issued.
    const deletes = recordedCalls.filter((c) => c.kind === "delete");
    expect(deletes).toHaveLength(1);
    // The DELETE WHERE clause must use inArray against a subquery, not
    // against an in-memory id list — that's the whole point of the fix.
    const where = deletes[0].where;
    expect(where.__op).toBe("inArray");
    expect(typeof where.src).toBe("object");
    expect(Array.isArray(where.src)).toBe(false);
  });

  it("surfaces remainingCandidateCount when the candidate set exceeds the per-call cap", async () => {
    // Simulate a much-larger eligible set than the cap. The fake db
    // returns the operator's chosen `deletedRowsValue.length` as the
    // delete count — pin that the action computes the remainder from
    // candidateCount minus deletedCount and surfaces it to the UI.
    candidateCountValue = 12_345;
    deletedRowsValue = Array.from({ length: 5_000 }, (_, i) => ({
      id: `c-${i}`,
    }));

    const result = await deleteUnredeemedCoupons();

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(5_000);
    expect(result.candidateCount).toBe(12_345);
    expect(result.remainingCandidateCount).toBe(7_345);
    // The bounded subquery must apply a LIMIT — verify the select chain
    // recorded a `.limit(...)` call before the delete.
    const subqueryLimits = recordedCalls.filter(
      (c) => c.kind === "select.limit",
    );
    expect(subqueryLimits.length).toBeGreaterThanOrEqual(1);
    const limitValues = subqueryLimits.map((c) => c.ctx.limit);
    expect(limitValues).toContain(result.maxPerCall);
  });

  it("returns success:false on db errors without throwing", async () => {
    candidateCountValue = 5;
    // Force the delete path to throw.
    deletedRowsValue = {
      get length() {
        throw new Error("boom");
      },
    };

    const result = await deleteUnredeemedCoupons();
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
