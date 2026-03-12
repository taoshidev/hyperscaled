const USE_TESTNET = process.env.NEXT_PUBLIC_USE_TESTNET === "true";

export const BASE_CHAIN_ID = USE_TESTNET ? 84532 : 8453;

export const BASE_NETWORK = USE_TESTNET ? "eip155:84532" : "eip155:8453";

export const USDC_ADDRESS = USE_TESTNET
  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const USDC_DECIMALS = 6;

export const USDC_EIP712_NAME = USE_TESTNET ? "USDC" : "USD Coin";
export const USDC_EIP712_VERSION = "2";

export const FACILITATOR_URL = "https://www.x402.org/facilitator";

export const BASESCAN_URL = USE_TESTNET
  ? "https://sepolia.basescan.org"
  : "https://basescan.org";

export const CHAIN_LABEL = USE_TESTNET ? "Base Sepolia" : "Base";

export const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/hyperliquid/ggkbhbjgnddjkobmkccppcfocfalifnl";

export const TIERS = [
  {
    id: "starter",
    name: "Starter",
    accountSize: 25000,
    fullPrice: 299,
    promoPrice: 149,
    badge: null,
    details: [
      "Max drawdown: 8%",
      "Daily loss limit: 4%",
      "Profit target: 10%",
      "100% performance rewards",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    accountSize: 50000,
    fullPrice: 549,
    promoPrice: 249,
    badge: "Most popular",
    details: [
      "Max drawdown: 8%",
      "Daily loss limit: 4%",
      "Profit target: 10%",
      "100% performance rewards",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    accountSize: 100000,
    fullPrice: 999,
    promoPrice: 449,
    badge: null,
    details: [
      "Max drawdown: 8%",
      "Daily loss limit: 4%",
      "Profit target: 10%",
      "100% performance rewards",
    ],
  },
];

export const VANTA_USDC_WALLET =
  process.env.NEXT_PUBLIC_VANTA_USDC_WALLET ||
  "0x0000000000000000000000000000000000000000";
