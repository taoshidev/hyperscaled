import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getMetaMaskProvider,
  findMetaMaskConnector,
} from "@/lib/metamask-provider";

describe("metamask-provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getMetaMaskProvider picks MetaMask from providers[] when Coinbase owns ethereum", () => {
    const coinbase = { isMetaMask: true, isCoinbaseWallet: true, request: vi.fn() };
    const metamask = { isMetaMask: true, isCoinbaseWallet: false, request: vi.fn() };
    vi.stubGlobal("window", {
      ethereum: { isMetaMask: true, isCoinbaseWallet: true, providers: [coinbase, metamask] },
    });
    expect(getMetaMaskProvider()).toBe(metamask);
  });

  it("findMetaMaskConnector prefers metaMask id", () => {
    const connectors = [
      { id: "coinbase", name: "Coinbase Wallet" },
      { id: "metaMask", name: "MetaMask" },
    ];
    expect(findMetaMaskConnector(connectors)?.id).toBe("metaMask");
  });
});
