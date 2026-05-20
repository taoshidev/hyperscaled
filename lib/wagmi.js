import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { coinbaseWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { mock } from "wagmi/connectors";
import { base, baseSepolia, arbitrum, arbitrumSepolia } from "wagmi/chains";
import { hyperscaledMetaMaskWallet } from "@/lib/hyperscaled-metamask-wallet";

const USE_TESTNET = process.env.USE_TESTNET === "true";
export const baseChain = USE_TESTNET ? baseSepolia : base;
export const arbChain = USE_TESTNET ? arbitrumSepolia : arbitrum;

const E2E_MOCK_WALLET =
  process.env.NEXT_PUBLIC_E2E_MOCK_WALLET === "true";
const E2E_MOCK_ADDRESS =
  process.env.NEXT_PUBLIC_E2E_MOCK_ADDRESS ||
  "0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1";

const productionConnectors = connectorsForWallets(
  [
    {
      groupName: "Connect",
      wallets: [hyperscaledMetaMaskWallet, coinbaseWallet],
    },
  ],
  {
    appName: "Hyperscaled",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  },
);

const e2eConnectors = [
  mock({
    accounts: [E2E_MOCK_ADDRESS],
    features: { reconnect: true },
  }),
];

export const wagmiConfig = createConfig({
  connectors: E2E_MOCK_WALLET ? e2eConnectors : productionConnectors,
  chains: [baseChain, arbChain],
  transports: {
    [baseChain.id]: http(),
    [arbChain.id]: http(),
  },
  ssr: true,
});
