import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { base, baseSepolia, arbitrum, arbitrumSepolia } from "wagmi/chains";

const USE_TESTNET = process.env.USE_TESTNET === "true";
const baseChain = USE_TESTNET ? baseSepolia : base;
const arbChain = USE_TESTNET ? arbitrumSepolia : arbitrum;

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
  chains: [baseChain, arbChain],
  transports: {
    [baseChain.id]: http(),
    [arbChain.id]: http(),
  },
  ssr: true,
});
