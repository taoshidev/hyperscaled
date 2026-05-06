import { describe, it, expect } from "vitest";

import {
  buildPayoutWindow,
  mondayUtcAtOrBefore,
  twelveHourBoundaryAtOrBefore,
  PAYOUT_WINDOW_WEEKS,
} from "../../lib/payout-window.js";

const MS_PER_DAY = 86_400_000;

function isoUtc(s) {
  return new Date(s).getTime();
}

describe("mondayUtcAtOrBefore", () => {
  it("returns the same Monday when given a Monday at midnight UTC", () => {
    const monday = isoUtc("2026-04-27T00:00:00.000Z");
    expect(mondayUtcAtOrBefore(monday)).toBe(monday);
  });

  it("snaps any later weekday back to that week's Monday", () => {
    const friday = isoUtc("2026-05-01T17:42:09.000Z");
    expect(mondayUtcAtOrBefore(friday)).toBe(
      isoUtc("2026-04-27T00:00:00.000Z"),
    );
  });

  it("snaps Sunday back to the previous Monday (not the next one)", () => {
    const sunday = isoUtc("2026-05-03T23:59:59.999Z");
    expect(mondayUtcAtOrBefore(sunday)).toBe(
      isoUtc("2026-04-27T00:00:00.000Z"),
    );
  });

  it("zeroes the time-of-day portion", () => {
    const monday = isoUtc("2026-04-27T13:14:15.123Z");
    const result = new Date(mondayUtcAtOrBefore(monday));
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });
});

describe("twelveHourBoundaryAtOrBefore", () => {
  it("returns the same value at exactly 00:00 UTC", () => {
    const t = isoUtc("2026-05-04T00:00:00.000Z");
    expect(twelveHourBoundaryAtOrBefore(t)).toBe(t);
  });

  it("returns the same value at exactly 12:00 UTC", () => {
    const t = isoUtc("2026-05-04T12:00:00.000Z");
    expect(twelveHourBoundaryAtOrBefore(t)).toBe(t);
  });

  it("snaps morning timestamps down to 00:00 UTC", () => {
    const t = isoUtc("2026-05-04T11:59:59.999Z");
    expect(twelveHourBoundaryAtOrBefore(t)).toBe(
      isoUtc("2026-05-04T00:00:00.000Z"),
    );
  });

  it("snaps afternoon timestamps down to 12:00 UTC", () => {
    const t = isoUtc("2026-05-04T23:59:59.999Z");
    expect(twelveHourBoundaryAtOrBefore(t)).toBe(
      isoUtc("2026-05-04T12:00:00.000Z"),
    );
  });
});

describe("buildPayoutWindow", () => {
  it("produces a Monday-aligned start and a 12-hour-aligned end", () => {
    // Tuesday afternoon — picked deliberately so neither raw value
    // already satisfies the validator's grid.
    const now = isoUtc("2026-05-05T20:36:27.483Z");
    const { startMs, endMs } = buildPayoutWindow(now);

    const start = new Date(startMs);
    expect(start.getUTCDay()).toBe(1); // Monday
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);

    const end = new Date(endMs);
    expect([0, 12]).toContain(end.getUTCHours());
    expect(end.getUTCMinutes()).toBe(0);
  });

  it("default window spans PAYOUT_WINDOW_WEEKS full weeks back from the anchor Monday", () => {
    const now = isoUtc("2026-05-05T20:36:27.483Z");
    const { startMs, endMs } = buildPayoutWindow(now);

    const anchorMonday = mondayUtcAtOrBefore(endMs);
    expect(anchorMonday - startMs).toBe(
      PAYOUT_WINDOW_WEEKS * 7 * MS_PER_DAY,
    );
  });

  it("respects an explicit weeks override", () => {
    const now = isoUtc("2026-05-05T20:36:27.483Z");
    const { startMs, endMs } = buildPayoutWindow(now, 1);
    const anchorMonday = mondayUtcAtOrBefore(endMs);
    expect(anchorMonday - startMs).toBe(7 * MS_PER_DAY);
  });

  it("never returns a start later than the end", () => {
    // Run across an entire week of midnights — startMs <= endMs must
    // always hold.
    const start = isoUtc("2026-04-27T00:00:00.000Z");
    for (let i = 0; i < 7; i++) {
      const t = start + i * MS_PER_DAY;
      const { startMs, endMs } = buildPayoutWindow(t);
      expect(startMs).toBeLessThanOrEqual(endMs);
    }
  });
});
