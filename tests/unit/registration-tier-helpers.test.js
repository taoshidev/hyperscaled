import { describe, expect, it } from "vitest";
import {
  isFreeTierForRegistration,
  tierBlockedForCaps,
} from "@/lib/registration-tier-helpers.js";

describe("registration-tier-helpers", () => {
  it("isFreeTierForRegistration identifies free id and $0 launch", () => {
    expect(isFreeTierForRegistration({ id: "free", launchPrice: 0 })).toBe(true);
    expect(isFreeTierForRegistration({ id: "tier-1", launchPrice: 29 })).toBe(false);
    expect(
      isFreeTierForRegistration({ id: "x", promoPrice: 0, fullPrice: 0 }),
    ).toBe(true);
  });

  it("tierBlockedForCaps respects free vs paid caps", () => {
    const free = { id: "free", launchPrice: 0 };
    const paid = { id: "tier-1", launchPrice: 29 };
    expect(tierBlockedForCaps(free, true, false)).toBe(true);
    expect(tierBlockedForCaps(free, false, true)).toBe(false);
    expect(tierBlockedForCaps(paid, false, true)).toBe(true);
    expect(tierBlockedForCaps(paid, true, false)).toBe(false);
  });
});
