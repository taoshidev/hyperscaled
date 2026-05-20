import { describe, expect, it, vi } from "vitest";
import { privateKeyToAccount } from "viem/accounts";

import { buildSignedHeaders } from "@/lib/wallet-auth-client.js";
import {
  verifyWalletSignature,
  buildSignedMessage,
} from "@/lib/wallet-auth.js";

// Replay-store mock — the client helper itself doesn't call it, but the
// round-trip test below asks the server-side verifier to accept the headers,
// which does call consumeNonce.
const consumeNonceMock = vi.fn().mockResolvedValue(true);
vi.mock("@/lib/nonce-store.js", () => ({
  consumeNonce: (...args) => consumeNonceMock(...args),
}));

const TEST_PRIVATE_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const TEST_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const account = privateKeyToAccount(TEST_PRIVATE_KEY);

const sign = ({ message }) => account.signMessage({ message });

describe("buildSignedHeaders", () => {
  it("throws when address is missing", async () => {
    await expect(
      buildSignedHeaders({
        path: "/api/x",
        body: "",
        signMessageAsync: sign,
      }),
    ).rejects.toThrow(/address is required/);
  });

  it("throws when signMessageAsync is missing", async () => {
    await expect(
      buildSignedHeaders({
        path: "/api/x",
        body: "",
        address: TEST_ADDRESS,
      }),
    ).rejects.toThrow(/signMessageAsync is required/);
  });

  it("returns headers with the expected three keys", async () => {
    const { headers } = await buildSignedHeaders({
      path: "/api/x",
      body: "",
      address: TEST_ADDRESS,
      signMessageAsync: sign,
    });
    expect(Object.keys(headers).sort()).toEqual(
      ["x-nonce", "x-signature", "x-wallet"].sort(),
    );
    expect(headers["x-wallet"]).toBe(TEST_ADDRESS);
    expect(headers["x-signature"]).toMatch(/^0x[0-9a-f]+$/i);
    expect(Number(headers["x-nonce"])).toBeGreaterThan(0);
  });

  it("returns the empty string body for GET-style calls", async () => {
    const { body } = await buildSignedHeaders({
      path: "/api/x",
      body: "",
      address: TEST_ADDRESS,
      signMessageAsync: sign,
    });
    expect(body).toBe("");
  });

  it("passes string bodies through unchanged (no re-stringify)", async () => {
    const raw = '{"a":1,"b":[2,3]}';
    const { body } = await buildSignedHeaders({
      path: "/api/x",
      body: raw,
      address: TEST_ADDRESS,
      signMessageAsync: sign,
    });
    expect(body).toBe(raw);
  });

  it("JSON.stringifies object bodies and signs the canonical string", async () => {
    const payload = { a: 1, b: [2, 3] };
    const { body, headers } = await buildSignedHeaders({
      path: "/api/x",
      body: payload,
      address: TEST_ADDRESS,
      signMessageAsync: sign,
    });
    expect(body).toBe(JSON.stringify(payload));
    // Re-derive the message and verify the signature is over THAT body.
    const expected = buildSignedMessage({
      path: "/api/x",
      nonce: headers["x-nonce"],
      body,
    });
    const recovered = await account.signMessage({ message: expected });
    expect(recovered).toBe(headers["x-signature"]);
  });

  it("calls signMessageAsync exactly once with the canonical message", async () => {
    const spy = vi.fn(sign);
    const path = "/api/dashboard/payout";
    const payload = { subaccount_uuid: "abc" };
    const { headers, body } = await buildSignedHeaders({
      path,
      body: payload,
      address: TEST_ADDRESS,
      signMessageAsync: spy,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const expected = buildSignedMessage({ path, nonce: headers["x-nonce"], body });
    expect(spy).toHaveBeenCalledWith({ message: expected });
  });
});

// Round-trip integration: client builds headers, server verifies them.
// This is the test that catches drift between the two modules.
describe("buildSignedHeaders ⇄ verifyWalletSignature round trip", () => {
  function makeRequest({ method, path, body, headers }) {
    return {
      method,
      url: `http://localhost:4568${path}`,
      headers: {
        get(name) {
          return headers[name.toLowerCase()] ?? null;
        },
      },
      async text() {
        return body || "";
      },
    };
  }

  it("server accepts headers produced by the client (POST with body)", async () => {
    const path = "/api/dashboard/payout";
    const payload = { subaccount_uuid: "abc", start_time_ms: 1, end_time_ms: 2 };
    const { headers, body } = await buildSignedHeaders({
      path,
      body: payload,
      address: TEST_ADDRESS,
      signMessageAsync: sign,
    });
    const req = makeRequest({ method: "POST", path, body, headers });
    const auth = await verifyWalletSignature(req);
    expect(auth.wallet).toBe(TEST_ADDRESS);
    expect(JSON.parse(auth.body)).toEqual(payload);
  });

  it("server accepts headers produced by the client (GET with empty body)", async () => {
    const path = "/api/kyc/status";
    const { headers } = await buildSignedHeaders({
      path,
      body: "",
      address: TEST_ADDRESS,
      signMessageAsync: sign,
    });
    const req = makeRequest({ method: "GET", path, body: "", headers });
    const auth = await verifyWalletSignature(req);
    expect(auth.wallet).toBe(TEST_ADDRESS);
  });

  it("server rejects when caller tampers with the body after signing", async () => {
    const path = "/api/dashboard/payout";
    const { headers } = await buildSignedHeaders({
      path,
      body: { subaccount_uuid: "abc" },
      address: TEST_ADDRESS,
      signMessageAsync: sign,
    });
    const req = makeRequest({
      method: "POST",
      path,
      body: '{"subaccount_uuid":"victim"}', // attacker swaps the target
      headers,
    });
    await expect(verifyWalletSignature(req)).rejects.toThrow(/Invalid signature/);
  });
});
