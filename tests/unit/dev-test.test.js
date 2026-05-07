import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env.DEV_TEST_WALLETS;

afterEach(() => {
  process.env.DEV_TEST_WALLETS = originalEnv;
  vi.resetModules();
});

async function freshImport() {
  vi.resetModules();
  return await import("@/lib/dev-test.js");
}

describe("isDevTestWallet", () => {
  beforeEach(() => {
    delete process.env.DEV_TEST_WALLETS;
  });

  it("returns false when DEV_TEST_WALLETS is unset", async () => {
    const mod = await freshImport();
    expect(mod.isDevTestWallet("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      false,
    );
  });

  it("returns true for a wallet in the allowlist (case-insensitive)", async () => {
    process.env.DEV_TEST_WALLETS =
      "0x1234567890ABCDEF1234567890ABCDEF12345678,0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const mod = await freshImport();
    expect(
      mod.isDevTestWallet("0x1234567890abcdef1234567890abcdef12345678"),
    ).toBe(true);
    expect(
      mod.isDevTestWallet("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF"),
    ).toBe(true);
  });

  it("ignores malformed entries in the allowlist", async () => {
    process.env.DEV_TEST_WALLETS = "not-an-address,0xshort,0x1234";
    const mod = await freshImport();
    expect(
      mod.isDevTestWallet("0x1234567890abcdef1234567890abcdef12345678"),
    ).toBe(false);
  });

  it("isAnyDevTestWallet returns true when any of the supplied wallets matches", async () => {
    process.env.DEV_TEST_WALLETS =
      "0x1234567890abcdef1234567890abcdef12345678";
    const mod = await freshImport();
    expect(
      mod.isAnyDevTestWallet(
        "0x0000000000000000000000000000000000000000",
        "0x1234567890abcdef1234567890abcdef12345678",
      ),
    ).toBe(true);
    expect(
      mod.isAnyDevTestWallet(
        "0x0000000000000000000000000000000000000000",
        "0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF",
      ),
    ).toBe(false);
  });
});
