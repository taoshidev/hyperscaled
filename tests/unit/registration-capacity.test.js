import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We control the DB's count() return values through a queue. Each call to
// `getDb` returns a new query stub whose final `.where()` resolves to a
// row containing the next `c` value from the queue. The helper does:
//
//   const [row] = await db.select({c: count()}).from(...).where(...)
//
// so we make `.where()` itself a thenable.
let countQueue = [];

function makeDb() {
  return {
    select() {
      return {
        from() {
          return {
            where() {
              const c = countQueue.shift();
              return Promise.resolve([{ c: c ?? 0 }]);
            },
          };
        },
      };
    },
  };
}

const getDbMock = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: (...args) => getDbMock(...args),
}));

vi.mock("@/lib/db/schema", () => ({
  registrations: {
    priceUsdc: "price_usdc",
    status: "status",
  },
}));

const {
  REGISTRATION_CAP_CODE,
  checkRegistrationCap,
  getConfiguredCaps,
  getRegistrationCapacitySnapshot,
  tierBucket,
} = await import("@/lib/registration-capacity.js");

beforeEach(() => {
  countQueue = [];
  getDbMock.mockReset().mockResolvedValue(makeDb());
  delete process.env.REGISTRATION_FREE_MAX;
  delete process.env.REGISTRATION_PAID_MAX;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("registration-capacity — env parsing", () => {
  it("returns null caps when env vars are unset", () => {
    expect(getConfiguredCaps()).toEqual({ free: null, paid: null });
  });

  it("parses positive integers", () => {
    process.env.REGISTRATION_FREE_MAX = "1000";
    process.env.REGISTRATION_PAID_MAX = "250";
    expect(getConfiguredCaps()).toEqual({ free: 1000, paid: 250 });
  });

  it("treats blank, non-numeric, and negative values as unset", () => {
    process.env.REGISTRATION_FREE_MAX = "   ";
    process.env.REGISTRATION_PAID_MAX = "abc";
    expect(getConfiguredCaps()).toEqual({ free: null, paid: null });

    process.env.REGISTRATION_FREE_MAX = "-5";
    expect(getConfiguredCaps().free).toBeNull();
  });

  it("supports zero (cap of zero closes the bucket entirely)", () => {
    process.env.REGISTRATION_FREE_MAX = "0";
    expect(getConfiguredCaps().free).toBe(0);
  });
});

describe("registration-capacity — tierBucket", () => {
  it("treats price 0 as free and any positive number as paid", () => {
    expect(tierBucket(0)).toBe("free");
    expect(tierBucket("0")).toBe("free");
    expect(tierBucket("0.00")).toBe("free");
    expect(tierBucket(0.01)).toBe("paid");
    expect(tierBucket("119.00")).toBe("paid");
  });
});

describe("registration-capacity — checkRegistrationCap", () => {
  it("returns null when no cap is configured", async () => {
    expect(await checkRegistrationCap("0")).toBeNull();
    expect(await checkRegistrationCap("119.00")).toBeNull();
    // No DB lookup should happen when cap is unconfigured.
    expect(getDbMock).not.toHaveBeenCalled();
  });

  it("returns FREE rejection when free count >= free cap", async () => {
    process.env.REGISTRATION_FREE_MAX = "10";
    countQueue.push(10);
    const result = await checkRegistrationCap("0");
    expect(result).not.toBeNull();
    expect(result.code).toBe(REGISTRATION_CAP_CODE.FREE);
    expect(result.error).toMatch(/free/i);
  });

  it("allows free signups when below the free cap", async () => {
    process.env.REGISTRATION_FREE_MAX = "10";
    countQueue.push(9);
    expect(await checkRegistrationCap("0.00")).toBeNull();
  });

  it("returns PAID rejection when paid count >= paid cap", async () => {
    process.env.REGISTRATION_PAID_MAX = "5";
    countQueue.push(5);
    const result = await checkRegistrationCap("119.00");
    expect(result).not.toBeNull();
    expect(result.code).toBe(REGISTRATION_CAP_CODE.PAID);
  });

  it("does not consult paid count when checking a free attempt", async () => {
    process.env.REGISTRATION_PAID_MAX = "1";
    process.env.REGISTRATION_FREE_MAX = "100";
    // Only the free count should be queried — `countQueue` has just one entry.
    countQueue.push(50);
    const result = await checkRegistrationCap("0");
    expect(result).toBeNull();
  });
});

describe("registration-capacity — getRegistrationCapacitySnapshot", () => {
  it("returns null max + atCapacity false when both caps are unset", async () => {
    const snap = await getRegistrationCapacitySnapshot();
    expect(snap).toEqual({
      free: { current: 0, max: null, atCapacity: false },
      paid: { current: 0, max: null, atCapacity: false },
    });
  });

  it("populates current counts and flags `atCapacity` correctly", async () => {
    process.env.REGISTRATION_FREE_MAX = "1000";
    process.env.REGISTRATION_PAID_MAX = "100";
    // Order: free count first, then paid count (driven by Promise.all order).
    countQueue.push(1000, 50);
    const snap = await getRegistrationCapacitySnapshot();
    expect(snap.free).toEqual({ current: 1000, max: 1000, atCapacity: true });
    expect(snap.paid).toEqual({ current: 50, max: 100, atCapacity: false });
  });

  it("only counts the bucket that has a cap configured", async () => {
    process.env.REGISTRATION_PAID_MAX = "5";
    countQueue.push(3); // paid only — free should not be queried
    const snap = await getRegistrationCapacitySnapshot();
    expect(snap.free.current).toBe(0);
    expect(snap.free.max).toBeNull();
    expect(snap.paid.current).toBe(3);
    expect(snap.paid.max).toBe(5);
  });
});
