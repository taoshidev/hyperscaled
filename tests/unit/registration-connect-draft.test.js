import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  persistConnectDraft,
  readConnectDraft,
  clearConnectDraft,
} from "@/lib/registration-connect-draft";

function mockSessionStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("registration-connect-draft", () => {
  beforeEach(() => {
    const sessionStorage = mockSessionStorage();
    vi.stubGlobal("sessionStorage", sessionStorage);
    vi.stubGlobal("window", { sessionStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips draft fields for matching miner and tier", () => {
    persistConnectDraft({
      minerSlug: "vanta",
      accountSize: 25000,
      hlWallet: "0x8dB8223560ba55744E1EBc84AEF1e9012D28A04a",
      email: "test@example.com",
      couponCode: "HS-TA34",
      paymentMethod: "eip712",
      payoutWallet: "",
    });

    const draft = readConnectDraft({ minerSlug: "vanta", accountSize: 25000 });
    expect(draft?.hlWallet).toBe("0x8dB8223560ba55744E1EBc84AEF1e9012D28A04a");
    expect(draft?.email).toBe("test@example.com");
    expect(draft?.couponCode).toBe("HS-TA34");
  });

  it("returns null when miner or tier does not match", () => {
    persistConnectDraft({
      minerSlug: "vanta",
      accountSize: 25000,
      hlWallet: "0xabc",
      email: "",
      couponCode: "",
      paymentMethod: null,
      payoutWallet: "",
    });

    expect(readConnectDraft({ minerSlug: "other", accountSize: 25000 })).toBeNull();
    expect(readConnectDraft({ minerSlug: "vanta", accountSize: 50000 })).toBeNull();
  });

  it("clearConnectDraft removes storage", () => {
    persistConnectDraft({
      minerSlug: "vanta",
      accountSize: 25000,
      hlWallet: "0xabc",
      email: "a@b.co",
      couponCode: "",
      paymentMethod: null,
      payoutWallet: "",
    });
    clearConnectDraft();
    expect(readConnectDraft({ minerSlug: "vanta", accountSize: 25000 })).toBeNull();
  });

  it("readConnectDraft consumes the draft (second read returns null)", () => {
    persistConnectDraft({
      minerSlug: "vanta",
      accountSize: 25000,
      hlWallet: "0xabc",
      email: "",
      couponCode: "HS-TA34",
      paymentMethod: null,
      payoutWallet: "",
    });

    const first = readConnectDraft({ minerSlug: "vanta", accountSize: 25000 });
    expect(first?.couponCode).toBe("HS-TA34");

    // Second read on a fresh navigation must NOT rehydrate stale form data.
    const second = readConnectDraft({ minerSlug: "vanta", accountSize: 25000 });
    expect(second).toBeNull();
  });

  it("returns null when the draft is older than the 90s TTL", () => {
    const realNow = Date.now;
    const t0 = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(t0);
    persistConnectDraft({
      minerSlug: "vanta",
      accountSize: 25000,
      hlWallet: "0xabc",
      email: "",
      couponCode: "HS-TA34",
      paymentMethod: null,
      payoutWallet: "",
    });

    // Jump past the new 90s TTL.
    Date.now.mockReturnValue(t0 + 91 * 1000);
    const stale = readConnectDraft({ minerSlug: "vanta", accountSize: 25000 });
    expect(stale).toBeNull();

    Date.now = realNow;
  });
});
