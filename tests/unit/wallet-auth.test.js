import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { privateKeyToAccount } from "viem/accounts";

// Mock the nonce store before importing the module under test.
const consumeNonceMock = vi.fn();
vi.mock("@/lib/nonce-store.js", () => ({
  consumeNonce: (...args) => consumeNonceMock(...args),
}));

const { buildSignedMessage, verifyWalletSignature } = await import(
  "@/lib/wallet-auth.js"
);

const TEST_PRIVATE_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const TEST_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const account = privateKeyToAccount(TEST_PRIVATE_KEY);

function makeRequest({ method, path, body, headers, host = "localhost:4568" }) {
  const url = `http://${host}${path}`;
  let consumed = false;
  return {
    method,
    url,
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
    async text() {
      if (consumed) throw new Error("body already read");
      consumed = true;
      return body || "";
    },
  };
}

beforeEach(() => {
  consumeNonceMock.mockReset();
  consumeNonceMock.mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("verifyWalletSignature", () => {
  it("accepts a valid signature and returns the recovered wallet + body", async () => {
    const path = "/api/dashboard/payout";
    const nonce = String(Date.now());
    const body = JSON.stringify({ subaccount_uuid: "abc" });
    const message = buildSignedMessage({ path, nonce, body });
    const signature = await account.signMessage({ message });

    const req = makeRequest({
      method: "POST",
      path,
      body,
      headers: {
        "x-wallet": TEST_ADDRESS,
        "x-signature": signature,
        "x-nonce": nonce,
      },
    });
    const auth = await verifyWalletSignature(req);
    expect(auth.wallet).toBe(TEST_ADDRESS);
    expect(JSON.parse(auth.body)).toEqual({ subaccount_uuid: "abc" });
    expect(consumeNonceMock).toHaveBeenCalledTimes(1);
  });

  it("rejects when headers are missing", async () => {
    const req = makeRequest({
      method: "POST",
      path: "/api/x",
      body: "",
      headers: {},
    });
    await expect(verifyWalletSignature(req)).rejects.toThrow(/Missing/);
  });

  it("rejects when nonce is too old", async () => {
    const path = "/api/x";
    const oldNonce = String(Date.now() - 10 * 60 * 1000);
    const body = "";
    const message = buildSignedMessage({ path, nonce: oldNonce, body });
    const signature = await account.signMessage({ message });
    const req = makeRequest({
      method: "POST",
      path,
      body,
      headers: {
        "x-wallet": TEST_ADDRESS,
        "x-signature": signature,
        "x-nonce": oldNonce,
      },
    });
    await expect(verifyWalletSignature(req)).rejects.toThrow(/Nonce/);
  });

  it("rejects when signature does not match the wallet", async () => {
    const path = "/api/x";
    const nonce = String(Date.now());
    const body = "";
    // Sign with one key, claim a different wallet header.
    const otherKey =
      "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba";
    const wrongAccount = privateKeyToAccount(otherKey);
    const message = buildSignedMessage({ path, nonce, body });
    const signature = await wrongAccount.signMessage({ message });
    const req = makeRequest({
      method: "POST",
      path,
      body,
      headers: {
        "x-wallet": TEST_ADDRESS,
        "x-signature": signature,
        "x-nonce": nonce,
      },
    });
    await expect(verifyWalletSignature(req)).rejects.toThrow(/Invalid signature/);
  });

  it("rejects on nonce reuse", async () => {
    consumeNonceMock.mockResolvedValueOnce(false);
    const path = "/api/x";
    const nonce = String(Date.now());
    const body = "";
    const message = buildSignedMessage({ path, nonce, body });
    const signature = await account.signMessage({ message });
    const req = makeRequest({
      method: "POST",
      path,
      body,
      headers: {
        "x-wallet": TEST_ADDRESS,
        "x-signature": signature,
        "x-nonce": nonce,
      },
    });
    await expect(verifyWalletSignature(req)).rejects.toThrow(/Nonce already used/);
  });

  it("rejects when the body is tampered with after signing", async () => {
    const path = "/api/x";
    const nonce = String(Date.now());
    const message = buildSignedMessage({ path, nonce, body: '{"a":1}' });
    const signature = await account.signMessage({ message });
    const req = makeRequest({
      method: "POST",
      path,
      body: '{"a":2}', // attacker tampers
      headers: {
        "x-wallet": TEST_ADDRESS,
        "x-signature": signature,
        "x-nonce": nonce,
      },
    });
    await expect(verifyWalletSignature(req)).rejects.toThrow(/Invalid signature/);
  });
});
