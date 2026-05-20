import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeConnectTarget,
  requestInjectedAccountPreselect,
  findInjectedConnector,
  connectPreferredAccount,
  isCoinbaseConnectorId,
} from "@/lib/connect-preferred-account";

describe("connect-preferred-account", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizeConnectTarget checksums valid addresses", () => {
    const lower = "0x8db8223560ba55744e1ebc84aef1e9012d28a04a";
    const out = normalizeConnectTarget(lower);
    expect(out).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(out).not.toBe(lower);
  });

  it("requestInjectedAccountPreselect sends restrictReturnedAccounts caveat", async () => {
    const request = vi.fn().mockResolvedValue([{ parentCapability: "eth_accounts" }]);
    const target = "0x8dB8223560ba55744E1EBc84AEF1e9012D28A04a";
    await requestInjectedAccountPreselect({ request }, target);
    expect(request).toHaveBeenCalledWith({
      method: "wallet_requestPermissions",
      params: [
        {
          eth_accounts: {
            caveats: [
              {
                type: "restrictReturnedAccounts",
                value: [target],
              },
            ],
          },
        },
      ],
    });
  });

  it("findInjectedConnector resolves metaMask connector", () => {
    const connectors = [
      { id: "coinbase", type: "coinbase" },
      { id: "metaMask", type: "injected" },
    ];
    expect(findInjectedConnector(connectors)?.id).toBe("metaMask");
  });

  it("connectPreferredAccount uses MetaMask from providers[] even when Coinbase owns ethereum", async () => {
    const coinbaseRequest = vi.fn();
    const metaMaskRequest = vi.fn().mockResolvedValue([]);
    const coinbase = {
      isMetaMask: true,
      isCoinbaseWallet: true,
      request: coinbaseRequest,
    };
    const metamask = {
      isMetaMask: true,
      isCoinbaseWallet: false,
      request: metaMaskRequest,
    };
    vi.stubGlobal("window", {
      ethereum: {
        isMetaMask: true,
        isCoinbaseWallet: true,
        providers: [coinbase, metamask],
      },
    });

    const disconnectAsync = vi.fn().mockResolvedValue(undefined);
    const connectAsync = vi.fn().mockResolvedValue(undefined);
    const connectors = [
      { id: "coinbase", name: "Coinbase Wallet" },
      { id: "metaMask", name: "MetaMask" },
    ];

    const result = await connectPreferredAccount({
      targetAddress: "0x8dB8223560ba55744E1EBc84AEF1e9012D28A04a",
      disconnectAsync,
      connectAsync,
      connectors,
    });

    expect(result).toBe("connected");
    expect(metaMaskRequest).toHaveBeenCalled();
    expect(coinbaseRequest).not.toHaveBeenCalled();
    expect(connectAsync).toHaveBeenCalledWith({ connector: connectors[1] });
  });

  it("returns modal when MetaMask is not installed", async () => {
    vi.stubGlobal("window", {
      ethereum: { isCoinbaseWallet: true, isMetaMask: false, request: vi.fn() },
    });

    const disconnectAsync = vi.fn().mockResolvedValue(undefined);
    const result = await connectPreferredAccount({
      targetAddress: "0x8dB8223560ba55744E1EBc84AEF1e9012D28A04a",
      disconnectAsync,
      connectAsync: vi.fn(),
      connectors: [{ id: "coinbase", name: "Coinbase Wallet" }],
    });

    expect(result).toBe("modal");
    expect(disconnectAsync).toHaveBeenCalled();
  });

  it("returns rejected when user dismisses MetaMask preselect", async () => {
    const metaMaskRequest = vi.fn().mockRejectedValue(
      Object.assign(new Error("User rejected the request."), {
        code: 4001,
        name: "UserRejectedRequestError",
      }),
    );
    vi.stubGlobal("window", {
      ethereum: {
        isMetaMask: true,
        isCoinbaseWallet: false,
        request: metaMaskRequest,
      },
    });

    const result = await connectPreferredAccount({
      targetAddress: "0x8dB8223560ba55744E1EBc84AEF1e9012D28A04a",
      disconnectAsync: vi.fn(),
      connectAsync: vi.fn(),
      connectors: [{ id: "metaMask", name: "MetaMask" }],
    });

    expect(result).toBe("rejected");
  });

  it("isCoinbaseConnectorId detects coinbase connectors", () => {
    expect(isCoinbaseConnectorId("coinbase")).toBe(true);
    expect(isCoinbaseConnectorId("metaMask")).toBe(false);
  });
});
