"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import { reportError } from "@/lib/errors";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => reportError(error, { source: "react-query" }),
  }),
  mutationCache: new MutationCache({
    onError: (error) => reportError(error, { source: "react-query-mutation" }),
  }),
});

export function Providers({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
