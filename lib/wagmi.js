import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { base, baseSepolia } from "wagmi/chains";

const USE_TESTNET = process.env.NEXT_PUBLIC_USE_TESTNET === "true";

export const wagmiConfig = getDefaultConfig({
  appName: "Hyperscaled",
  projectId: "DISABLED",
  chains: [USE_TESTNET ? baseSepolia : base],
  ssr: true,
  wallets: [
    {
      groupName: "Connect",
      wallets: [injectedWallet, coinbaseWallet],
    },
  ],
});
