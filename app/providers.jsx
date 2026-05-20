"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useConnect } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import { reportError } from "@/lib/errors";
import {
  isWalletRequestPending,
  isWalletUserRejection,
} from "@/lib/wallet-user-rejection";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CoinbaseDisconnectGuard } from "@/components/CoinbaseDisconnectGuard";
import "@rainbow-me/rainbowkit/styles.css";

const E2E_MOCK_WALLET =
  process.env.NEXT_PUBLIC_E2E_MOCK_WALLET === "true";

function shouldReportQueryError(error) {
  if (isWalletUserRejection(error) || isWalletRequestPending(error)) {
    return false;
  }
  const name = error?.name ?? "";
  if (name.includes("ConnectorChainMismatch")) return false;
  return true;
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (shouldReportQueryError(error)) {
        reportError(error, { source: "react-query" });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (shouldReportQueryError(error)) {
        reportError(error, { source: "react-query-mutation" });
      }
    },
  }),
});

function E2EAutoConnect() {
  const { connect, connectors } = useConnect();
  const { status } = useAccount();

  useEffect(() => {
    if (status === "connected" || status === "connecting" || status === "reconnecting") {
      return;
    }
    if (connectors.length === 0) return;
    connect({ connector: connectors[0] });
  }, [status, connectors, connect]);

  return null;
}

export function Providers({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <CoinbaseDisconnectGuard />
          {E2E_MOCK_WALLET && <E2EAutoConnect />}
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
