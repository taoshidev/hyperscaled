const USE_TESTNET = process.env.USE_TESTNET === "true";

export const BASE_CHAIN_ID = USE_TESTNET ? 84532 : 8453;

export const BASE_NETWORK = USE_TESTNET ? "eip155:84532" : "eip155:8453";

export const USDC_ADDRESS = USE_TESTNET
  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const USDC_DECIMALS = 6;

export const USDC_EIP712_NAME = USE_TESTNET ? "USDC" : "USD Coin";
export const USDC_EIP712_VERSION = "2";

export const FACILITATOR_URL = USE_TESTNET
  ? "https://www.x402.org/facilitator"
  : "https://api.cdp.coinbase.com/platform/v2/x402";

export const BASESCAN_URL = USE_TESTNET
  ? "https://sepolia.basescan.org"
  : "https://basescan.org";

export const CHAIN_LABEL = USE_TESTNET ? "Base Sepolia" : "Base";

export const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/hyperscaled/edgpadgidgmdhlmedlaimccpladmbboj";

export const HL_API_URL = USE_TESTNET
  ? "https://api.hyperliquid-testnet.xyz"
  : "https://api.hyperliquid.xyz";

export const HL_SIGNING_CHAIN_ID = USE_TESTNET ? 421614 : 42161;
export const HL_CHAIN_NAME = USE_TESTNET ? "Testnet" : "Mainnet";

export const HYPERLIQUID_SIGNUP_URL = "https://app.hyperliquid.xyz/join/HYPERSCALED";

// Empty when unset — callers must treat "" as "builder code disabled".
export const HYPERSCALED_BUILDER_ADDRESS =
  process.env.NEXT_PUBLIC_HYPERSCALED_BUILDER_ADDRESS || "";

export const TIERS = [
  {
    id: "free",
    name: "Free",
    accountSize: 1000,
    fullPrice: 0,
    promoPrice: 0,
    badge: "Only 1,000 Available",
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "None" },
    ],
  },
  {
    id: "nano",
    name: "Starter",
    accountSize: 5000,
    fullPrice: 59,
    promoPrice: 59,
    badge: null,
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $400K" },
    ],
  },
  {
    id: "micro",
    name: "Tier I",
    accountSize: 10000,
    fullPrice: 109,
    promoPrice: 109,
    badge: null,
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $400K" },
    ],
  },
  {
    id: "starter",
    name: "Tier II",
    accountSize: 25000,
    fullPrice: 239,
    promoPrice: 239,
    badge: null,
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $400K" },
    ],
  },
  {
    id: "pro",
    name: "Tier III",
    accountSize: 50000,
    fullPrice: 499,
    promoPrice: 499,
    badge: null,
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $400K" },
    ],
  },
  {
    id: "elite",
    name: "Tier IV",
    accountSize: 100000,
    fullPrice: 799,
    promoPrice: 799,
    badge: "Most Popular",
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $400K" },
    ],
  },
];

// ── Network & Hero Stats ──

export function getNetworkStats(accountType = 'scaled') {
  return [
    { value: '$1B+', label: 'Network Volume', description: 'Total trading volume processed across the network' },
    { value: '5,500+', label: 'Traders', description: `Active ${accountType} traders across all integrated firms` },
    { value: '$30M+', label: 'Network Rewards Distributed', description: 'Performance rewards distributed directly to trader wallets, onchain and verifiable' },
    { value: '$400K', label: 'Max Account Size', description: `Top-tier ${accountType} capital available through performance scaling` },
    { value: '100%', label: 'Profit Split', description: 'Keep every dollar you earn — the best profit split in the industry' },
  ]
}

export const NETWORK_STATS = getNetworkStats()

export const HERO_STATS = [
  { value: '1-Step', label: 'Challenge' },
  { value: '100%', label: 'Profit Split' },
  { value: '$30M+', label: 'Rewards Distributed' },
]

// ── Challenge & Funded Rules ──

export const EVAL_RULES = [
  { rule: 'Profit Target', parameter: '10% of starting account balance' },
  { rule: 'Daily Loss Limit', parameter: '5% — account equity cannot drop more than 5% from the day\'s opening equity at any point during the day' },
  { rule: 'EOD Trailing Loss Limit', parameter: '5% — end-of-day equity cannot drop more than 5% from the end-of-day high water mark' },
  { rule: 'Time Limit', parameter: 'None — but 30 consecutive days of inactivity will result in elimination' },
  { rule: 'Challenge Phases', parameter: '1' },
  { rule: 'Trading Day Reset', parameter: '00:00 UTC' },
  { rule: 'News Trading', parameter: 'Allowed' },
  { rule: 'Minimum Trading Days', parameter: 'None' },
  { rule: 'Consistency Criteria', parameter: 'None' },
  { rule: 'Weekend Trading', parameter: 'Allowed' },
  { rule: 'Tradable Pairs', parameter: '60 predefined pairs across crypto, commodities, indices, and stocks — see full list on the rules page' },
]

export function getFundedRules(accountType = 'scaled', brandName = 'Hyperscaled') {
  return [
    { rule: 'Daily Loss Limit', parameter: '8% from the day\'s opening equity' },
    { rule: 'EOD Trailing Loss Limit', parameter: '8% from end-of-day high water mark' },
    { rule: 'Profit Target', parameter: `None — no profit target on ${accountType} accounts` },
    { rule: 'Payout Cycle', parameter: 'Monthly' },
    { rule: 'Profit Split', parameter: `100% — ${brandName} takes 0%, including on ${accountType} accounts` },
    { rule: 'Inactivity', parameter: '30 consecutive days with no trades results in account elimination' },
    { rule: 'Account Breach Consequence', parameter: 'Funded account is closed. You may re-enter the challenge at any time.' },
  ]
}

export const FUNDED_RULES = getFundedRules()

// ── Leverage & Buying Power ──

export const BUYING_POWER_BY_SIZE = [
  { size: '$1,000',   challenge: 'A',  funded: 'B' },
  { size: '$5,000',   challenge: 'A',  funded: 'B' },
  { size: '$10,000',  challenge: 'A',  funded: 'B' },
  { size: '$25,000',  challenge: 'A',  funded: 'B' },
  { size: '$50,000',  challenge: 'A',  funded: 'B' },
  { size: '$100,000', challenge: 'A',  funded: 'B' },
  { size: '$200,000', challenge: '—',  funded: 'C' },
  { size: '$300,000', challenge: '—',  funded: 'C' },
  { size: '$400,000', challenge: '—',  funded: 'C' },
]

export const WEIGHT_LIMITS = [
  { tier: 'A', perPair: '50%',  portfolio: '200%' },
  { tier: 'B', perPair: '100%', portfolio: '200%' },
  { tier: 'C', perPair: '150%', portfolio: '300%' },
]

/** @deprecated Use WEIGHT_LIMITS instead */
export const LEVERAGE_LIMITS = WEIGHT_LIMITS

// ── Tradable Pairs ──

export const TRADABLE_PAIRS = [
  {
    category: 'Crypto',
    count: 31,
    pairs: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT', 'TON', 'TRX', 'LTC', 'TAO', 'SUI', 'ARB', 'NEAR', 'ALGO', 'ASTER', 'UNI', 'AAVE', 'CRV', 'HYPE', 'XMR', 'ZEC', 'PAXG', 'ENA', 'ZRO', 'WLD', 'PUMP', 'kPEPE'],
  },
  {
    category: 'Commodities',
    count: 7,
    pairs: ['WTIOIL (CL)', 'BRENTOIL', 'GOLD', 'SILVER', 'COPPER', 'NATGAS', 'PLATINUM'],
  },
  {
    category: 'Indices',
    count: 3,
    pairs: ['SP500', 'XYZ100 (Nasdaq 100)', 'EWY'],
  },
  {
    category: 'Stocks',
    count: 19,
    pairs: ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'COIN', 'CRCL', 'MSTR', 'PLTR', 'AMD', 'TSM', 'NFLX', 'SNDK', 'INTC', 'MU', 'HOOD', 'ORCL'],
  },
]

// ── Spread, Fees & Slippage ──

export const FEE_RULES = [
  { rule: 'Transaction Fees', parameter: '0.045% for market orders, 0.015% for limit orders' },
  { rule: 'Slippage', parameter: 'Market orders: simulated from Hyperliquid’s live L2 orderbook to replicate real market conditions. Limit orders: zero slippage, filled at the original limit price (subject to change).' },
  { rule: 'Funding', parameter: 'Settled every hour using Hyperliquid’s actual settled funding rate. When the rate is positive, longs pay and shorts receive. When negative, longs receive and shorts pay.' },
]

// ── Scaling Path ──

export const SCALING_PATH = [
  { from: '$5,000',   to: '$10,000' },
  { from: '$10,000',  to: '$25,000' },
  { from: '$25,000',  to: '$50,000' },
  { from: '$50,000',  to: '$100,000' },
  { from: '$100,000', to: '$200,000' },
  { from: '$200,000', to: '$300,000' },
  { from: '$300,000', to: '$400,000' },
]

export const SCALING_MILESTONES = [
  '$5K', '$10K', '$25K', '$50K', '$100K', '$200K', '$300K', '$400K'
]

// ── Pricing Tiers ──

// Convert a marketing tier's display `accountSize` (e.g. `"$5,000"`) to
// the numeric size used by `/api/miners/[slug]` and the registration
// flow's `?tier=<size>` deep-link. Returns null for unparseable input.
export function parseTierAccountSize(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Marketing-page pricing fallback. Used when a brand's miner row hasn't been
// seeded yet, or when a marketing page hasn't been wired to fetch tiers from
// the DB. These are the *standard* (non-promo) prices — `launchPrice` equals
// `standardPrice` so the strikethrough in `PricingPage.jsx` etc. doesn't
// render. Vanta's promotional pricing is applied via the DB seed
// (`VANTA_PROMO_TIER_PRICES` in `lib/db/seed.mjs`) and surfaced through
// `fetchDbPricingTiers("vanta")` on vanta + hyperscaled marketing pages.
export const PRICING_TIERS = [
  {
    id: 'free',
    name: '$1K Account',
    accountSize: '$1,000',
    launchPrice: 0,
    standardPrice: 0,
    profitTarget: '10%',
    profitTargetAmount: '$100',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$50',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'None',
    timeLimit: 'None',
    cta: 'Try for Free',
    popular: false,
  },
  {
    id: 'tier-1',
    name: '$5K Account',
    accountSize: '$5,000',
    launchPrice: 59,
    standardPrice: 59,
    profitTarget: '10%',
    profitTargetAmount: '$500',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$250',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $400K',
    timeLimit: 'None',
    cta: 'Start $5K Challenge',
    popular: false,
  },
  {
    id: 'tier-2',
    name: '$10K Account',
    accountSize: '$10,000',
    launchPrice: 109,
    standardPrice: 109,
    profitTarget: '10%',
    profitTargetAmount: '$1,000',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$500',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $400K',
    timeLimit: 'None',
    cta: 'Start $10K Challenge',
    popular: false,
  },
  {
    id: 'tier-3',
    name: '$25K Account',
    accountSize: '$25,000',
    launchPrice: 239,
    standardPrice: 239,
    profitTarget: '10%',
    profitTargetAmount: '$2,500',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$1,250',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $400K',
    timeLimit: 'None',
    cta: 'Start $25K Challenge',
    popular: false,
  },
  {
    id: 'tier-4',
    name: '$50K Account',
    accountSize: '$50,000',
    launchPrice: 499,
    standardPrice: 499,
    profitTarget: '10%',
    profitTargetAmount: '$5,000',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$2,500',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $400K',
    timeLimit: 'None',
    cta: 'Start $50K Challenge',
    popular: false,
  },
  {
    id: 'tier-5',
    name: '$100K Account',
    accountSize: '$100,000',
    launchPrice: 799,
    standardPrice: 799,
    profitTarget: '10%',
    profitTargetAmount: '$10,000',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$5,000',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $400K',
    timeLimit: 'None',
    cta: 'Start $100K Challenge',
    popular: true,
  },
]

// ── FAQ ──

export const FAQ_ITEMS = [
  {
    category: 'Getting Started',
    items: [
      {
        id: 'what-is-hyperscaled',
        question: 'What is Hyperscaled?',
        answer: 'Hyperscaled is a scaled trading platform built natively on Hyperliquid. You trade on Hyperliquid with your own wallet, and Hyperscaled evaluates your performance against a simulated scaled account. Pass the challenge and you receive USDC performance rewards — automatically, onchain, every 30\u00a0days.',
      },
      {
        id: 'create-account',
        question: 'Do I need to create an account?',
        answer: 'You connect your Hyperliquid wallet at app.hyperscaled.trade. No email address, no username, no\u00a0password. Your wallet is your\u00a0identity.',
      },
      {
        id: 'countries-eligible',
        question: 'Which countries are eligible?',
        answer: 'Trade from anywhere with a Hyperliquid wallet. KYC is required only to receive your first payout.',
      },
    ],
  },
  {
    category: 'The Challenge',
    items: [
      {
        id: 'how-challenge-works',
        question: 'How does the one-step challenge work?',
        answer: 'Select an account size (free $1K, or paid $5K, $10K, $25K, $50K, or $100K), pay the one-time registration fee, and start trading on Hyperliquid. Hyperscaled reads your public trade data and mirrors it into a simulated scaled account. Hit a 10% profit target while staying within both the 5% daily loss limit and 5% EOD trailing loss limit to\u00a0pass.',
      },
      {
        id: 'time-limit',
        question: 'Is there a time limit to pass the challenge?',
        answer: 'There is no fixed deadline to pass the challenge. However, 30 consecutive days of inactivity (no trades placed) will result in elimination. You may re-register and start a new challenge at any\u00a0time.',
      },
      {
        id: 'daily-loss-limit',
        question: 'What is the daily loss limit?',
        answer: 'During the challenge, your account equity cannot drop more than 5% from the day\'s opening equity at any point during the trading day. On scaled accounts the limit widens to 8%. The trading day resets at 00:00\u00a0UTC.',
      },
      {
        id: 'eod-trailing',
        question: 'What is the EOD trailing loss limit?',
        answer: 'End-of-day account equity cannot drop more than 5% from your end-of-day high water mark during the challenge. On scaled accounts the limit widens to\u00a08%.',
      },
      {
        id: 'news-trading',
        question: 'Can I trade during news events?',
        answer: 'Yes. News trading is explicitly allowed with no\u00a0restrictions.',
      },
      {
        id: 'algo-trading',
        question: 'Can I trade algorithmically?',
        answer: 'Yes. Algorithmic and automated strategies are permitted. The only prohibited strategy is martingale or martingale-like approaches (progressively increasing position size after losses) — see the full disqualification rules for\u00a0details.',
      },
      {
        id: 'breach-drawdown',
        question: 'What happens if I breach a drawdown rule?',
        answer: 'During the challenge, breaching either the daily or EOD trailing drawdown rule terminates the challenge immediately. On a scaled account, the same breach closes the funded account. In either case you can re-register and start a new challenge at any time by paying the registration fee\u00a0again.',
      },
      {
        id: 'inactivity',
        question: 'What happens if I stop trading?',
        answer: '30 consecutive days with no trades placed will result in elimination \u2014 this applies to both challenge and scaled accounts. There is no minimum trading frequency otherwise. You can re-register and start a new challenge at any\u00a0time.',
      },
    ],
  },
  {
    category: 'Funded Accounts & Payouts',
    items: [
      {
        id: 'what-changes-scaled',
        question: 'What changes once I\'m scaled?',
        answer: 'The profit target is removed — there\'s no target to hit on scaled accounts. Your drawdown limit increases to 8% (from 5% during the challenge). You receive monthly USDC payouts based on your realized\u00a0profits.',
      },
      {
        id: 'when-paid',
        question: 'When and how do I get paid?',
        answer: 'At the end of each monthly cycle, your payout is calculated automatically and sent in USDC to your connected wallet. No manual request required. No withdrawal fees. Every payout is verifiable\u00a0onchain.',
      },
      {
        id: 'profit-split',
        question: 'What is the profit split?',
        answer: '100%. Hyperscaled takes 0% of your profits, including on accounts scaled above\u00a0$100K.',
      },
      {
        id: 'profit-target-scaled',
        question: 'Do I need to hit a profit target to receive payouts?',
        answer: 'No. Once scaled, you receive USDC rewards based on any realized profits during the monthly cycle. There is no minimum profit\u00a0target.',
      },
      {
        id: 'scaling-works',
        question: 'How does account scaling work?',
        answer: 'Scaling is automatic and based on performance thresholds — no application, no additional fees. To qualify for an account size increase you need a 5% quarterly return on your current account size and an all-time Sharpe ratio greater than 1. Scaling occurs at the end of the quarter in which qualifications are met, up to a maximum of\u00a0$400K.',
      },
    ],
  },
  {
    category: 'KYC & Identity',
    items: [
      {
        id: 'kyc-required',
        question: 'Do I need to submit KYC documents?',
        answer: 'No KYC is required to register or trade. KYC is required only to receive your first payout. You will be prompted to complete a brief identity verification via our KYC provider — no trading history or bank details\u00a0required.',
      },
      {
        id: 'why-kyc',
        question: 'Why is KYC required for payouts?',
        answer: 'Payout KYC is a compliance requirement for USDC distribution — specifically to ensure AML and sanctions compliance before USDC transfers to your wallet. It has no bearing on your ability to participate in the challenge or\u00a0trade.',
      },
    ],
  },
  {
    category: 'Technical & Platform',
    items: [
      {
        id: 'what-built-on',
        question: 'What is Hyperscaled built on?',
        answer: 'Hyperscaled is built natively on Hyperliquid and powered by decentralized challenge infrastructure. All payouts are in USDC and fully verifiable\u00a0onchain.',
      },
      {
        id: 'api-keys',
        question: 'Do I need to share my API keys?',
        answer: 'No. Hyperscaled reads your trade data from Hyperliquid\'s public data stream via websockets. No API keys, no custody permissions, no access to your account\u00a0controls.',
      },
      {
        id: 'install-anything',
        question: 'Do I need to install anything?',
        answer: 'You access your challenge dashboard at app.hyperscaled.trade. No separate software installation is required to\u00a0participate.',
      },
      {
        id: 'which-perpetuals',
        question: 'What perpetuals can I trade?',
        answer: 'You can trade any perpetual available on Hyperliquid. However, only 60 predefined trading pairs across crypto, commodities, indices, and stocks are tracked and counted toward your Hyperscaled trading\u00a0performance.',
      },
      {
        id: 'weight-limits',
        question: 'What are the weight limits?',
        answer: 'Hyperscaled enforces two independent weight limits: a per-pair limit (max exposure to a single trading pair) and a portfolio limit (max aggregate exposure across all tracked positions). During the challenge, all account sizes use Weight Tier A (50% per pair, 200% portfolio). On a funded account, $1K\u2013$100K use Tier B (100% per pair, 200% portfolio), and accounts scaled to $200K\u2013$400K use Tier C (150% per pair, 300% portfolio). All limits are enforced automatically by the\u00a0platform.',
      },
      {
        id: 'trading-fees',
        question: 'What fees do I pay to trade?',
        answer: 'Transaction fees are 0.045% for market orders and 0.015% for limit orders. Slippage on market orders is simulated from Hyperliquid\'s live L2 orderbook; limit orders have zero slippage. Funding is settled every hour using Hyperliquid\'s actual settled funding rate (when the rate is positive, longs pay and shorts receive; when negative, longs receive and shorts pay). No other fees\u00a0apply.',
      },
      {
        id: 'trading-pairs',
        question: 'What pairs are available to trade?',
        answer: 'There are 60 predefined trading pairs across crypto, commodities, indices, and stocks. Although you can trade any pair on Hyperliquid, only these 60 pairs are tracked and counted toward your Hyperscaled trading\u00a0performance.',
      },
    ],
  },
]

export const HOME_FAQ_IDS = [
  'kyc-required',
  'how-challenge-works',
  'when-paid',
  'news-trading',
  'scaling-works',
]

export const PRICING_FAQ_IDS = [
  'fee-refundable',
  'retry-challenge',
  'other-fees',
]

export const PRICING_FAQ = [
  {
    id: 'fee-refundable',
    question: 'Is the registration fee refundable?',
    answer: 'No. The fee is a one-time, non-refundable access fee to enter the challenge. This is standard across all prop trading challenge\u00a0models.',
  },
  {
    id: 'retry-challenge',
    question: 'Can I retry if I fail the challenge?',
    answer: 'Yes. You can re-register at any time by paying the registration fee again. There is no limit on\u00a0retries.',
  },
  {
    id: 'other-fees',
    question: 'Are there any other fees?',
    answer: 'None. No subscriptions, no monthly fees, no withdrawal fees. The one-time registration fee is the only cost to\u00a0participate.',
  },
]
