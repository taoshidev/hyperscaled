/**
 * Unit coverage for the one-time-coupon race fix.
 *
 * The reservation pattern (lock coupon row → count existing redemptions →
 * INSERT placeholder row → commit) is what prevents two concurrent
 * registrations from both settling at the discounted price. Before this
 * fix the redemption write happened AFTER on-chain settlement and
 * silently deduped: the second user paid the discount with no audit row
 * and no error.
 *
 * These tests use an in-memory fake of the drizzle handle that:
 *   - serializes `db.transaction(...)` callbacks so the "FOR UPDATE"
 *     lock is honored (only one transaction holds the lock at a time).
 *   - keeps a single shared list of `coupons` and `couponRedemptions`
 *     rows so concurrent reservations see each other's writes.
 *
 * The race scenario fires two concurrent `reserveCouponRedemption` calls
 * against a one-time coupon. The fix's contract: exactly one returns
 * `ok: true`, the other returns `code: "ALREADY_REDEEMED"`. The previous
 * code path silently let both through.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";

// Hoisted-safe schema mock — opaque tags identified by their `__name`.
vi.mock("@/lib/db/schema", () => ({
  coupons: { __name: "coupons" },
  couponRedemptions: { __name: "couponRedemptions" },
}));

// drizzle-orm helpers are used as opaque markers in registration-pricing.js;
// the in-memory fake db ignores predicates entirely, so a no-op factory
// that returns descriptive objects keeps the import chain happy.
vi.mock("drizzle-orm", () => ({
  eq: (...args) => ({ __op: "eq", args }),
  count: () => ({ __op: "count" }),
  and: (...args) => ({ __op: "and", args }),
  sql: (strings, ...values) => ({ __op: "sql", strings, values }),
}));

const {
  reserveCouponRedemption,
  finalizeCouponRedemption,
  releaseCouponRedemption,
  COUPON_RESERVATION_ERRORS,
} = await import("@/lib/registration-pricing");

function makeFakeDb({ coupons, redemptions = [] }) {
  let nextRedemptionId = 1;
  // Simple mutex around `transaction` to model SELECT … FOR UPDATE on a
  // single coupon row: only one transaction observes/mutates redemption
  // state at a time. Real Postgres only serializes contenders for the
  // SAME row, but in this test all transactions target the same coupon.
  let txQueue = Promise.resolve();

  const select = (cols) => ({
    from: (table) => {
      const ctx = { table, cols, where: null };
      // For COUNT queries the route awaits the where() result directly
      // (no .limit). For probes it chains .limit(1). Make the where()
      // result both thenable and `.limit`-aware so both shapes work.
      const where = (cond) => {
        const localCtx = { ...ctx, where: cond };
        const result = {
          limit: async () => routeSelect(localCtx),
        };
        result.then = (resolve, reject) =>
          Promise.resolve(routeSelect(localCtx)).then(resolve, reject);
        return result;
      };
      return { where };
    },
  });

  const tableNames = {
    coupons: "coupons",
    couponRedemptions: "couponRedemptions",
  };

  function tableNameOf(table) {
    if (!table || typeof table !== "object") return null;
    if (table.__name === "coupons") return "coupons";
    if (table.__name === "couponRedemptions") return "couponRedemptions";
    return null;
  }

  function routeSelect(ctx) {
    const name = tableNameOf(ctx.table);
    if (name === "coupons") {
      return coupons.length > 0 ? [coupons[0]] : [];
    }
    if (name === "couponRedemptions") {
      // Either a one-time existence probe or a count.
      if (ctx.cols && ctx.cols.c !== undefined) {
        return [{ c: redemptions.length }];
      }
      return redemptions.map((r) => ({ id: r.id }));
    }
    return [];
  }

  const insert = (table) => ({
    values: (vals) => ({
      returning: async () => {
        if (tableNameOf(table) === "couponRedemptions") {
          const id = `redemption-${nextRedemptionId++}`;
          redemptions.push({ id, ...vals });
          return [{ id }];
        }
        return [];
      },
    }),
  });

  const update = (table) => ({
    set: (vals) => ({
      where: async () => {
        if (tableNameOf(table) === "couponRedemptions") {
          const id = vals?.id;
          // Caller passes a where(eq(id, redemptionId)) but our fake
          // ignores the predicate and matches by paymentIntentId set.
          // Update by the most-recent insert if no specific match found.
          const target = redemptions.find((r) => r.id === id) ?? redemptions[0];
          if (target && Object.prototype.hasOwnProperty.call(vals, "paymentIntentId")) {
            target.paymentIntentId = vals.paymentIntentId;
          }
        }
        return undefined;
      },
    }),
  });

  const del = (table) => ({
    where: async () => {
      if (tableNameOf(table) === "couponRedemptions") {
        // Simplified: drop the most-recent reservation (matches the
        // contract that release() targets a known redemptionId).
        redemptions.pop();
      }
      return undefined;
    },
  });

  // The transaction callback model — serialized so SELECT FOR UPDATE
  // semantics hold. The transaction handle exposes the same surface as
  // the top-level db, plus `.execute()` for the raw SQL lock query.
  const transaction = (cb) => {
    const run = async () => {
      const tx = {
        execute: async () => ({ rows: coupons.length > 0 ? [coupons[0]] : [] }),
        select,
        insert,
        update,
        delete: del,
      };
      return cb(tx);
    };
    const next = txQueue.then(run);
    // Don't propagate failures into the queue — let each transaction
    // independently succeed/fail without blocking the next.
    txQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };

  return {
    select,
    insert,
    update,
    delete: del,
    transaction,
  };
}

describe("reserveCouponRedemption — one-time coupon race", () => {
  let coupons;
  let redemptions;
  let db;

  beforeEach(() => {
    coupons = [{ id: "coupon-A", useType: "one_time", maxUses: null }];
    redemptions = [];
    db = makeFakeDb({ coupons, redemptions });
  });

  it("first reservation succeeds with a redemptionId", async () => {
    const r = await reserveCouponRedemption(db, {
      couponId: "coupon-A",
      userId: 1,
    });
    expect(r.ok).toBe(true);
    expect(r.redemptionId).toMatch(/^redemption-/);
    expect(redemptions).toHaveLength(1);
    expect(redemptions[0].paymentIntentId).toBeNull();
  });

  it("second writer in a one-time race is denied (ALREADY_REDEEMED)", async () => {
    // Two concurrent reservation attempts. Without serialization +
    // existence check this would let both insert. With the fix only one
    // wins; the loser sees the placeholder row and bails.
    const [first, second] = await Promise.all([
      reserveCouponRedemption(db, { couponId: "coupon-A", userId: 1 }),
      reserveCouponRedemption(db, { couponId: "coupon-A", userId: 2 }),
    ]);

    const wins = [first, second].filter((r) => r.ok);
    const losses = [first, second].filter((r) => !r.ok);

    expect(wins).toHaveLength(1);
    expect(losses).toHaveLength(1);
    expect(losses[0].code).toBe(COUPON_RESERVATION_ERRORS.ALREADY_REDEEMED);
    expect(losses[0].error).toMatch(/already been used/i);
    // Exactly one redemption row exists — no silent double-write.
    expect(redemptions).toHaveLength(1);
  });

  it("releasing a reservation lets a new caller succeed", async () => {
    const first = await reserveCouponRedemption(db, {
      couponId: "coupon-A",
      userId: 1,
    });
    expect(first.ok).toBe(true);

    await releaseCouponRedemption(db, { redemptionId: first.redemptionId });
    expect(redemptions).toHaveLength(0);

    const second = await reserveCouponRedemption(db, {
      couponId: "coupon-A",
      userId: 2,
    });
    expect(second.ok).toBe(true);
    expect(redemptions).toHaveLength(1);
  });

  it("finalize stamps the reservation with the txHash", async () => {
    const r = await reserveCouponRedemption(db, {
      couponId: "coupon-A",
      userId: 1,
    });
    expect(r.ok).toBe(true);

    const f = await finalizeCouponRedemption(db, {
      redemptionId: r.redemptionId,
      paymentIntentId: "0xdeadbeef",
    });
    expect(f.ok).toBe(true);
    expect(redemptions[0].paymentIntentId).toBe("0xdeadbeef");
  });
});

describe("reserveCouponRedemption — multi-use coupon with cap", () => {
  it("denies the (maxUses + 1)-th writer with LIMIT_REACHED", async () => {
    const coupons = [{ id: "coupon-B", useType: "multi_use", maxUses: 2 }];
    const redemptions = [];
    const db = makeFakeDb({ coupons, redemptions });

    const r1 = await reserveCouponRedemption(db, {
      couponId: "coupon-B",
      userId: 1,
    });
    const r2 = await reserveCouponRedemption(db, {
      couponId: "coupon-B",
      userId: 2,
    });
    const r3 = await reserveCouponRedemption(db, {
      couponId: "coupon-B",
      userId: 3,
    });

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r3.ok).toBe(false);
    expect(r3.code).toBe(COUPON_RESERVATION_ERRORS.LIMIT_REACHED);
    expect(redemptions).toHaveLength(2);
  });
});

describe("reserveCouponRedemption — input validation", () => {
  it("rejects calls with no couponId", async () => {
    const db = makeFakeDb({ coupons: [] });
    const r = await reserveCouponRedemption(db, {
      couponId: null,
      userId: 1,
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe(COUPON_RESERVATION_ERRORS.NOT_FOUND);
  });

  it("rejects calls with a missing/invalid userId", async () => {
    const db = makeFakeDb({ coupons: [] });
    const r = await reserveCouponRedemption(db, {
      couponId: "coupon-A",
      userId: null,
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe(COUPON_RESERVATION_ERRORS.DB_ERROR);
  });
});
