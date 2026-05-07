"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useConnect } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import { reportError } from "@/lib/errors";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@rainbow-me/rainbowkit/styles.css";

const E2E_MOCK_WALLET =
  process.env.NEXT_PUBLIC_E2E_MOCK_WALLET === "true";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => reportError(error, { source: "react-query" }),
  }),
  mutationCache: new MutationCache({
    onError: (error) => reportError(error, { source: "react-query-mutation" }),
  }),
});

// E2E only — RainbowKit never opens a connect modal in tests, so we
// fire `connect()` once on mount to make `useAccount()` report the
// mocked wallet as connected.
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
          {E2E_MOCK_WALLET && <E2EAutoConnect />}
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
