import { getAddress } from "viem";
import {
  findMetaMaskConnector,
  getMetaMaskProvider,
} from "@/lib/metamask-provider";
import { withReloadSuppressed } from "@/lib/suppress-reload";
import {
  isWalletRequestPending,
  isWalletUserRejection,
} from "@/lib/wallet-user-rejection";

export function normalizeConnectTarget(address) {
  if (!address || typeof address !== "string") return null;
  try {
    return getAddress(address.trim());
  } catch {
    return null;
  }
}

export async function requestInjectedAccountPreselect(provider, targetAddress) {
  if (!provider?.request || !targetAddress) {
    throw new Error("No MetaMask provider available");
  }

  await provider.request({
    method: "wallet_requestPermissions",
    params: [
      {
        eth_accounts: {
          caveats: [
            {
              type: "restrictReturnedAccounts",
              value: [targetAddress],
            },
          ],
        },
      },
    ],
  });
}

export function findInjectedConnector(connectors) {
  return findMetaMaskConnector(connectors);
}

export function isCoinbaseConnectorId(connectorId) {
  if (!connectorId) return false;
  const id = connectorId.toLowerCase();
  return id === "coinbase" || id.includes("coinbase");
}

async function safeDisconnect(disconnectAsync) {
  await withReloadSuppressed(async () => {
    try {
      await disconnectAsync();
    } catch {
      /* already disconnected */
    }
  });
}

export async function connectPreferredAccount({
  targetAddress,
  disconnectAsync,
  connectAsync,
  connectors,
  chainId,
}) {
  const checksummed = normalizeConnectTarget(targetAddress);
  if (!checksummed) {
    await safeDisconnect(disconnectAsync);
    return "modal";
  }

  const metaMaskConnector = findMetaMaskConnector(connectors);
  const metaMaskProvider = getMetaMaskProvider();

  if (metaMaskConnector && metaMaskProvider) {
    try {
      return await withReloadSuppressed(async () => {
        await requestInjectedAccountPreselect(metaMaskProvider, checksummed);
        await safeDisconnect(disconnectAsync);
        await connectAsync({
          connector: metaMaskConnector,
          ...(chainId != null ? { chainId } : {}),
        });
        return "connected";
      });
    } catch (err) {
      if (isWalletUserRejection(err)) {
        return "rejected";
      }
      if (isWalletRequestPending(err)) {
        return "pending";
      }
    }
  }

  await safeDisconnect(disconnectAsync);
  return "modal";
}
