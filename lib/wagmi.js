import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

const USE_TESTNET = process.env.NEXT_PUBLIC_USE_TESTNET === "true";
const chain = USE_TESTNET ? baseSepolia : base;

const connectors = connectorsForWallets(
  [
    {
      groupName: "Connect",
      wallets: [injectedWallet, coinbaseWallet],
    },
  ],
  {
    appName: "Hyperscaled",
    projectId: "",
  },
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [chain],
  transports: {
    [chain.id]: http(),
  },
  ssr: true,
});
