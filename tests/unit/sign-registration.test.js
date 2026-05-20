/**
 * Tests for `lib/sign-registration.js` — the client-side helper that
 * gates the wallet-ownership signature for `/api/register` calls.
 *
 * It is allowed to call `signMessageAsync` ONLY when the connected
 * wallet equals the typed HL address. Mismatches throw a user-facing
 * Error before the wallet popup appears, so the user gets a clear
 * "switch wallet" message instead of a cryptic server-side rejection.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const buildSignedHeadersMock = vi.fn();
vi.mock("@/lib/wallet-auth-client", () => ({
  buildSignedHeaders: (...args) => buildSignedHeadersMock(...args),
}));

const { signRegistrationRequest } = await import("@/lib/sign-registration.js");

const HL_ADDRESS = "0x1111111111111111111111111111111111111111";
const OTHER_WALLET = "0x2222222222222222222222222222222222222222";

beforeEach(() => {
  buildSignedHeadersMock.mockReset();
  buildSignedHeadersMock.mockResolvedValue({
    headers: {
      "x-wallet": HL_ADDRESS,
      "x-signature": "0xsig",
      "x-nonce": "1",
    },
    body: '{"hello":"world"}',
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("signRegistrationRequest", () => {
  it("throws a clear error when wallet is not connected", async () => {
    await expect(
      signRegistrationRequest({
        path: "/api/register",
        body: { hlAddress: HL_ADDRESS },
        hlAddress: HL_ADDRESS,
        connectedAddress: undefined,
        signMessageAsync: vi.fn(),
      }),
    ).rejects.toThrow(/Connect your wallet/);
    expect(buildSignedHeadersMock).not.toHaveBeenCalled();
  });

  it("throws a clear error when hlAddress is missing", async () => {
    await expect(
      signRegistrationRequest({
        path: "/api/register",
        body: {},
        hlAddress: "",
        connectedAddress: HL_ADDRESS,
        signMessageAsync: vi.fn(),
      }),
    ).rejects.toThrow(/Hyperliquid wallet address/);
    expect(buildSignedHeadersMock).not.toHaveBeenCalled();
  });

  it("throws (and does NOT pop a wallet prompt) when connected wallet ≠ hl_address", async () => {
    const signFn = vi.fn();
    await expect(
      signRegistrationRequest({
        path: "/api/register",
        body: { hlAddress: HL_ADDRESS },
        hlAddress: HL_ADDRESS,
        connectedAddress: OTHER_WALLET,
        signMessageAsync: signFn,
      }),
    ).rejects.toThrow(/Connect 0x.*to sign ownership/);
    // The whole point of this gate: never reach signMessageAsync when the
    // signature would just produce a server-side 403.
    expect(signFn).not.toHaveBeenCalled();
    expect(buildSignedHeadersMock).not.toHaveBeenCalled();
  });

  it("treats addresses case-insensitively", async () => {
    const signFn = vi.fn();
    await signRegistrationRequest({
      path: "/api/register",
      body: { hlAddress: HL_ADDRESS },
      hlAddress: HL_ADDRESS.toUpperCase(),
      connectedAddress: HL_ADDRESS.toLowerCase(),
      signMessageAsync: signFn,
    });
    expect(buildSignedHeadersMock).toHaveBeenCalledOnce();
  });

  it("delegates to buildSignedHeaders with the connected wallet on success", async () => {
    const signFn = vi.fn();
    const result = await signRegistrationRequest({
      path: "/api/register/preflight",
      body: { hlAddress: HL_ADDRESS },
      hlAddress: HL_ADDRESS,
      connectedAddress: HL_ADDRESS,
      signMessageAsync: signFn,
    });

    expect(buildSignedHeadersMock).toHaveBeenCalledOnce();
    expect(buildSignedHeadersMock).toHaveBeenCalledWith({
      path: "/api/register/preflight",
      body: { hlAddress: HL_ADDRESS },
      address: HL_ADDRESS,
      signMessageAsync: signFn,
    });
    expect(result.headers["x-wallet"]).toBe(HL_ADDRESS);
    expect(result.body).toBe('{"hello":"world"}');
  });

  it("defaults `path` to /api/register when not provided", async () => {
    await signRegistrationRequest({
      body: { hlAddress: HL_ADDRESS },
      hlAddress: HL_ADDRESS,
      connectedAddress: HL_ADDRESS,
      signMessageAsync: vi.fn(),
    });
    expect(buildSignedHeadersMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/api/register" }),
    );
  });
});
