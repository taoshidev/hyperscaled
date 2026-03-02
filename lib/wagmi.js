import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";

const USE_TESTNET = process.env.NEXT_PUBLIC_USE_TESTNET === "true";

export const wagmiConfig = getDefaultConfig({
  appName: "Hyperscaled",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
  chains: [USE_TESTNET ? baseSepolia : base],
  ssr: true,
});
