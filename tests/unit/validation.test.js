import { describe, expect, it } from "vitest";

import {
  isValidEmail,
  isValidEvmAddress,
  isValidHLAddress,
} from "@/lib/validation";

describe("isValidEvmAddress", () => {
  it("accepts canonical 0x-prefixed 20-byte addresses", () => {
    expect(
      isValidEvmAddress("0x0000000000000000000000000000000000000000"),
    ).toBe(true);
    expect(
      isValidEvmAddress("0xAbCdEf0123456789abcdef0123456789AbCdEf01"),
    ).toBe(true);
  });

  it("rejects non-hex, wrong-length, or unprefixed strings", () => {
    expect(isValidEvmAddress("0x123")).toBe(false);
    expect(isValidEvmAddress("0x" + "z".repeat(40))).toBe(false);
    expect(isValidEvmAddress("0000000000000000000000000000000000000000")).toBe(
      false,
    );
    expect(isValidEvmAddress(undefined)).toBe(false);
    expect(isValidEvmAddress(null)).toBe(false);
  });
});

describe("isValidHLAddress", () => {
  it("matches isValidEvmAddress for the address shape", () => {
    expect(
      isValidHLAddress("0xAbCdEf0123456789abcdef0123456789AbCdEf01"),
    ).toBe(true);
    expect(isValidHLAddress("0xabc")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts ordinary emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("first.last+tag@sub.example.co")).toBe(true);
  });

  it("rejects strings missing @ or TLD", () => {
    expect(isValidEmail("user-without-at.com")).toBe(false);
    expect(isValidEmail("user@no-tld")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
