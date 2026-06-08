/**
 * Coverage for the campaign↔coupon boundary (`lib/campaign-coupon.js`).
 *
 * Coupons are shared, first-class entities (partner / affiliate / evergreen
 * codes). A code review flagged that attaching a campaign used to silently
 * rewrite a shared coupon's validity window (always) and its discount (on a
 * code collision). These tests lock in the fixed contract:
 *
 *   - Existing-coupon mode (`couponId`) attaches by id and NEVER mutates the
 *     coupon.
 *   - New-coupon mode errors on a code collision instead of adopting /
 *     repurposing someone else's coupon.
 *   - New-coupon mode creates a `campaign_owned` coupon whose window tracks the
 *     campaign.
 *   - `syncOwnedCouponWindow` only rewrites coupons the campaign owns AND that
 *     no other campaign references.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/schema", () => ({
  coupons: {
    id: "coupons.id",
    code: "coupons.code",
    campaignOwned: "coupons.campaign_owned",
  },
  promotionalCampaigns: {
    id: "promotional_campaigns.id",
    couponId: "promotional_campaigns.coupon_id",
  },
}));

const { resolveCampaignCoupon, syncOwnedCouponWindow } = await import(
  "@/lib/campaign-coupon"
);

/**
 * Minimal Drizzle-shaped mock. Each `select(...)` / `insert(...)` / `update(...)`
 * call shifts the next queued result off `selectResults` and records the chain
 * so assertions can inspect what was written.
 */
function makeDb({ selectResults = [], insertResult = [] } = {}) {
  const calls = { inserts: [], updates: [], selects: 0 };
  const queue = [...selectResults];

  const thenable = (value) => ({
    limit: async () => value,
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  });

  return {
    calls,
    select() {
      calls.selects += 1;
      const value = queue.length ? queue.shift() : [];
      return { from: () => ({ where: () => thenable(value) }) };
    },
    insert(table) {
      return {
        values: (vals) => {
          calls.inserts.push({ table, vals });
          return { returning: async () => insertResult };
        },
      };
    },
    update(table) {
      return {
        set: (vals) => {
          calls.updates.push({ table, vals });
          return { where: async () => undefined };
        },
      };
    },
  };
}

describe("resolveCampaignCoupon — existing-coupon mode", () => {
  it("attaches by id without mutating the coupon", async () => {
    const db = makeDb({ selectResults: [[{ id: "coupon-1" }]] });
    const id = await resolveCampaignCoupon(
      db,
      {
        couponId: "coupon-1",
        code: "PARTNER20",
        startsAt: new Date("2026-01-01"),
        endsAt: new Date("2026-01-08"),
      },
      "0xstaff",
    );
    expect(id).toBe("coupon-1");
    // The crux of the fix: no write to the shared coupon.
    expect(db.calls.updates).toHaveLength(0);
    expect(db.calls.inserts).toHaveLength(0);
  });

  it("errors when the selected coupon no longer exists", async () => {
    const db = makeDb({ selectResults: [[]] });
    await expect(
      resolveCampaignCoupon(db, { couponId: "ghost" }, "0xstaff"),
    ).rejects.toThrow(/no longer exists/i);
    expect(db.calls.updates).toHaveLength(0);
  });
});

describe("resolveCampaignCoupon — new-coupon mode", () => {
  it("errors on a code collision instead of adopting/repurposing the coupon", async () => {
    const db = makeDb({ selectResults: [[{ id: "existing-evergreen" }]] });
    await expect(
      resolveCampaignCoupon(
        db,
        {
          couponId: null,
          code: "partner20",
          discountType: "percent",
          discountValue: 50,
          startsAt: new Date("2026-01-01"),
          endsAt: new Date("2026-01-08"),
        },
        "0xstaff",
      ),
    ).rejects.toThrow(/already in use/i);
    // No discount/window mutation of the colliding coupon.
    expect(db.calls.updates).toHaveLength(0);
    expect(db.calls.inserts).toHaveLength(0);
  });

  it("creates a campaign-owned coupon whose window tracks the campaign", async () => {
    const startsAt = new Date("2026-01-01");
    const endsAt = new Date("2026-01-08");
    const db = makeDb({
      selectResults: [[]],
      insertResult: [{ id: "new-coupon" }],
    });
    const id = await resolveCampaignCoupon(
      db,
      {
        couponId: null,
        code: "flash7",
        discountType: "percent",
        discountValue: 40,
        startsAt,
        endsAt,
      },
      "0xstaff",
    );
    expect(id).toBe("new-coupon");
    expect(db.calls.inserts).toHaveLength(1);
    const { vals } = db.calls.inserts[0];
    expect(vals.code).toBe("FLASH7");
    expect(vals.campaignOwned).toBe(true);
    expect(vals.validFrom).toBe(startsAt);
    expect(vals.validUntil).toBe(endsAt);
  });

  it("requires a discount when creating a brand-new coupon", async () => {
    const db = makeDb({ selectResults: [[]] });
    await expect(
      resolveCampaignCoupon(db, { couponId: null, code: "NODISC" }, "0xstaff"),
    ).rejects.toThrow(/discount type and value/i);
  });
});

describe("syncOwnedCouponWindow", () => {
  const startsAt = new Date("2026-02-01");
  const endsAt = new Date("2026-02-15");

  it("rewrites the window for an owned coupon referenced by only this campaign", async () => {
    const db = makeDb({
      selectResults: [[{ campaignOwned: true }], [{ count: 0 }]],
    });
    const did = await syncOwnedCouponWindow(
      db,
      "owned-coupon",
      startsAt,
      endsAt,
      "campaign-1",
    );
    expect(did).toBe(true);
    expect(db.calls.updates).toHaveLength(1);
    expect(db.calls.updates[0].vals.validFrom).toBe(startsAt);
    expect(db.calls.updates[0].vals.validUntil).toBe(endsAt);
  });

  it("never touches a shared (non-owned) coupon", async () => {
    const db = makeDb({ selectResults: [[{ campaignOwned: false }]] });
    const did = await syncOwnedCouponWindow(
      db,
      "partner-coupon",
      startsAt,
      endsAt,
      "campaign-1",
    );
    expect(did).toBe(false);
    expect(db.calls.updates).toHaveLength(0);
  });

  it("won't fight over an owned coupon another campaign also references", async () => {
    const db = makeDb({
      selectResults: [[{ campaignOwned: true }], [{ count: 1 }]],
    });
    const did = await syncOwnedCouponWindow(
      db,
      "shared-owned",
      startsAt,
      endsAt,
      "campaign-1",
    );
    expect(did).toBe(false);
    expect(db.calls.updates).toHaveLength(0);
  });
});
