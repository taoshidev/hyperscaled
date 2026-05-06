/**
 * Tests for `lib/wallet-auth-shared.js` — the canonical signed-message
 * builder shared between the server (`lib/wallet-auth.js`) and the
 * client (`lib/wallet-auth-client.js`).
 *
 * Asserts the format the server expects so a future refactor that
 * accidentally changes whitespace, separator, body-hash representation,
 * etc., breaks here loudly instead of silently rejecting every
 * production signature.
 */
import { describe, expect, it } from "vitest";

const { buildSignedMessage } = await import("@/lib/wallet-auth-shared.js");

describe("buildSignedMessage", () => {
  it("uses the literal 'GET' for empty bodies", () => {
    const msg = buildSignedMessage({
      path: "/api/dashboard/payout",
      nonce: "1700000000000",
      body: "",
    });
    expect(msg).toBe("/api/dashboard/payout:1700000000000:GET");
  });

  it("uses the literal 'GET' for null/undefined bodies", () => {
    expect(
      buildSignedMessage({
        path: "/api/x",
        nonce: "1",
        body: null,
      }),
    ).toBe("/api/x:1:GET");
    expect(
      buildSignedMessage({
        path: "/api/x",
        nonce: "1",
        body: undefined,
      }),
    ).toBe("/api/x:1:GET");
  });

  it("hashes a non-empty body to a 64-char hex string with no 0x prefix", () => {
    const msg = buildSignedMessage({
      path: "/api/register",
      nonce: "1",
      body: '{"hl_address":"0xabc"}',
    });
    const [path, nonce, hash] = msg.split(":");
    expect(path).toBe("/api/register");
    expect(nonce).toBe("1");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for identical inputs", () => {
    const a = buildSignedMessage({ path: "/p", nonce: "1", body: "hello" });
    const b = buildSignedMessage({ path: "/p", nonce: "1", body: "hello" });
    expect(a).toBe(b);
  });

  it("differs when the body changes by even one byte (request binding)", () => {
    const a = buildSignedMessage({ path: "/p", nonce: "1", body: "hello" });
    const b = buildSignedMessage({ path: "/p", nonce: "1", body: "Hello" });
    expect(a).not.toBe(b);
  });

  it("differs when the path changes (cross-route replay defense)", () => {
    const a = buildSignedMessage({ path: "/api/a", nonce: "1", body: "x" });
    const b = buildSignedMessage({ path: "/api/b", nonce: "1", body: "x" });
    expect(a).not.toBe(b);
  });

  it("differs when the nonce changes (replay defense)", () => {
    const a = buildSignedMessage({ path: "/p", nonce: "1", body: "x" });
    const b = buildSignedMessage({ path: "/p", nonce: "2", body: "x" });
    expect(a).not.toBe(b);
  });
});
