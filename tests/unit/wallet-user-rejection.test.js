import { describe, it, expect } from "vitest";
import { isWalletUserRejection } from "@/lib/wallet-user-rejection";

describe("wallet-user-rejection", () => {
  it("detects EIP-1193 code 4001", () => {
    expect(isWalletUserRejection({ code: 4001 })).toBe(true);
  });

  it("detects viem UserRejectedRequestError by name", () => {
    expect(
      isWalletUserRejection({
        name: "UserRejectedRequestError",
        message: "User rejected the request.",
      }),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isWalletUserRejection(new Error("network error"))).toBe(false);
  });
});
