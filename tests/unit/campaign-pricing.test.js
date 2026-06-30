import { describe, expect, it } from "vitest";

import { applyCampaignToTierPrice, serializeActiveCampaign } from "@/lib/campaign-pricing";

const baseCampaign = {
  id: "camp-1",
  name: "WSB55 Flash Sale",
  slug: "wsb55",
  startsAt: new Date("2026-06-01T00:00:00Z"),
  endsAt: new Date("2026-06-08T00:00:00Z"),
  bannerEnabled: true,
  bannerText: null,
  tierPriceOverrides: null,
  entityMinerHotkey: null,
  minerSlug: null,
  coupon: {
    id: "coupon-1",
    code: "WSB55",
    discountType: "percent",
    discountValue: 55,
  },
};

describe("applyCampaignToTierPrice", () => {
  it("returns identical current/original when no campaign", () => {
    const r = applyCampaignToTierPrice(5000, 74, null);
    expect(r).toEqual({ currentPrice: 74, originalPrice: 74 });
  });

  it("applies a percent coupon discount, rounding the payable up to a whole dollar", () => {
    const r = applyCampaignToTierPrice(5000, 74, baseCampaign);
    expect(r.originalPrice).toBe(74);
    // 74 * (1 - 0.55) = 33.30 → rounded up to a clean $34.
    expect(r.currentPrice).toBe(34);
  });

  it("applies a fixed coupon discount with floor at 0", () => {
    const c = {
      ...baseCampaign,
      coupon: { ...baseCampaign.coupon, discountType: "fixed", discountValue: 100 },
    };
    const r = applyCampaignToTierPrice(5000, 74, c);
    expect(r).toEqual({ currentPrice: 0, originalPrice: 74 });
  });

  it("uses per-tier overrides when set, ignoring the coupon discount", () => {
    const c = {
      ...baseCampaign,
      tierPriceOverrides: { "5000": 37, "10000": 67 },
    };
    expect(applyCampaignToTierPrice(5000, 74, c)).toEqual({
      currentPrice: 37,
      originalPrice: 74,
    });
    expect(applyCampaignToTierPrice(10000, 135, c)).toEqual({
      currentPrice: 67,
      originalPrice: 135,
    });
  });

  it("falls back to the coupon discount when an override is missing for a tier", () => {
    const c = {
      ...baseCampaign,
      tierPriceOverrides: { "5000": 37 },
    };
    const r = applyCampaignToTierPrice(10000, 135, c);
    expect(r.originalPrice).toBe(135);
    expect(r.currentPrice).toBe(61); // 135 * 0.45 = 60.75 → rounded up to 61
  });

  it("leaves a free tier (price 0) at zero", () => {
    expect(applyCampaignToTierPrice(1000, 0, baseCampaign)).toEqual({
      currentPrice: 0,
      originalPrice: 0,
    });
  });
});

describe("serializeActiveCampaign", () => {
  it("returns null when given null", () => {
    expect(serializeActiveCampaign(null)).toBeNull();
  });

  it("converts Date objects to ISO strings", () => {
    const out = serializeActiveCampaign(baseCampaign);
    expect(out?.startsAt).toBe(baseCampaign.startsAt.toISOString());
    expect(out?.endsAt).toBe(baseCampaign.endsAt.toISOString());
  });
});
