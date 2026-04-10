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

export const TIERS = [
  {
    id: "nano",
    name: "Tier I",
    accountSize: 5000,
    fullPrice: 79,
    promoPrice: 39,
    badge: null,
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $100k" },
    ],
  },
  {
    id: "micro",
    name: "Tier II",
    accountSize: 10000,
    fullPrice: 139,
    promoPrice: 69,
    badge: null,
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $100k" },
    ],
  },
  {
    id: "starter",
    name: "Tier III",
    accountSize: 25000,
    fullPrice: 299,
    promoPrice: 149,
    badge: null,
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $100k" },
    ],
  },
  {
    id: "pro",
    name: "Tier IV",
    accountSize: 50000,
    fullPrice: 549,
    promoPrice: 249,
    badge: null,
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $100k" },
    ],
  },
  {
    id: "elite",
    name: "Tier V",
    accountSize: 100000,
    fullPrice: 999,
    promoPrice: 449,
    badge: "Most Popular",
    details: [
      { label: "Profit Target", value: "10%" },
      { label: "Max Drawdown", value: "5%" },
      { label: "Time Limit", value: "None" },
      { label: "Account Scaling", value: "Up to $2.5m" },
    ],
  },
];

export const HYPERSCALED_USDC_WALLET =
  process.env.NEXT_PUBLIC_HYPERSCALED_USDC_WALLET ||
  "0x0000000000000000000000000000000000000000";

// ── Network & Hero Stats ──

export const NETWORK_STATS = [
  { value: '$1B+', label: 'Network Volume', description: 'Total trading volume processed across the network' },
  { value: '5,500+', label: 'Traders', description: 'Active scaled traders across all integrated firms' },
  { value: '$30M+', label: 'Network Rewards Distributed', description: 'Performance rewards distributed directly to trader wallets, onchain and verifiable' },
  { value: '$2.5M', label: 'Max Account Size', description: 'Top-tier scaled capital available through performance scaling' },
  { value: '100%', label: 'Profit Split', description: 'Keep every dollar you earn — the best profit split in the industry' },
]

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
  { rule: 'Time Limit', parameter: 'None' },
  { rule: 'Challenge Phases', parameter: '1' },
  { rule: 'Trading Day Reset', parameter: '00:00 UTC' },
  { rule: 'News Trading', parameter: 'Allowed' },
  { rule: 'Minimum Trading Days', parameter: 'None' },
  { rule: 'Consistency Criteria', parameter: 'None' },
  { rule: 'Weekend Trading', parameter: 'Allowed' },
  { rule: 'Tradeable Pairs', parameter: 'BTC, ETH, ADA, XRP, SOL, DOGE, TAO, HYPE, ZEC, BCH, LINK, XMR, LTC' },
]

export const FUNDED_RULES = [
  { rule: 'Daily Loss Limit', parameter: '8% from the day\'s opening equity' },
  { rule: 'EOD Trailing Loss Limit', parameter: '8% from end-of-day high water mark' },
  { rule: 'Profit Target', parameter: 'None — no profit target on scaled accounts' },
  { rule: 'Payout Cycle', parameter: 'Monthly' },
  { rule: 'Profit Split', parameter: '100% — Hyperscaled takes 0%, including on scaled accounts' },
  { rule: 'Account Breach Consequence', parameter: 'Funded account is closed. You may re-enter the challenge at any time.' },
]

// ── Scaling Path ──

export const SCALING_PATH = [
  { from: '$100,000', to: '$200,000' },
  { from: '$200,000', to: '$300,000' },
  { from: '$300,000', to: '$400,000' },
  { from: '$400,000', to: '$500,000' },
  { from: '$500,000', to: '$750,000' },
  { from: '$750,000', to: '$1,000,000' },
  { from: '$1,000,000', to: '$1,500,000' },
  { from: '$1,500,000', to: '$2,000,000' },
  { from: '$2,000,000', to: '$2,500,000' },
]

export const SCALING_MILESTONES = [
  '$5K', '$10K', '$25K', '$50K', '$100K', '$200K', '$300K', '$400K', '$500K', '$750K', '$1M', '$1.5M', '$2M', '$2.5M'
]

// ── Pricing Tiers ──

export const PRICING_TIERS = [
  {
    id: 'tier-1',
    name: '$5K Account',
    accountSize: '$5,000',
    launchPrice: 39,
    standardPrice: 79,
    profitTarget: '10%',
    profitTargetAmount: '$500',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$250',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $100K',
    timeLimit: 'None',
    cta: 'Start $5K Challenge',
    popular: false,
  },
  {
    id: 'tier-2',
    name: '$10K Account',
    accountSize: '$10,000',
    launchPrice: 69,
    standardPrice: 139,
    profitTarget: '10%',
    profitTargetAmount: '$1,000',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$500',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $100K',
    timeLimit: 'None',
    cta: 'Start $10K Challenge',
    popular: false,
  },
  {
    id: 'tier-3',
    name: '$25K Account',
    accountSize: '$25,000',
    launchPrice: 149,
    standardPrice: 299,
    profitTarget: '10%',
    profitTargetAmount: '$2,500',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$1,250',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $100K',
    timeLimit: 'None',
    cta: 'Start $25K Challenge',
    popular: false,
  },
  {
    id: 'tier-4',
    name: '$50K Account',
    accountSize: '$50,000',
    launchPrice: 249,
    standardPrice: 549,
    profitTarget: '10%',
    profitTargetAmount: '$5,000',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$2,500',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $100K',
    timeLimit: 'None',
    cta: 'Start $50K Challenge',
    popular: false,
  },
  {
    id: 'tier-5',
    name: '$100K Account',
    accountSize: '$100,000',
    launchPrice: 449,
    standardPrice: 999,
    profitTarget: '10%',
    profitTargetAmount: '$10,000',
    maxDrawdown: '5%',
    maxDrawdownAmount: '$5,000',
    profitSplit: '100%',
    payoutCycle: 'Monthly',
    scalingPath: 'Up to $2.5M',
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
        answer: 'Hyperscaled is a scaled trading platform built natively on Hyperliquid. You trade on Hyperliquid with your own wallet, and Hyperscaled evaluates your performance against a simulated scaled account. Pass the challenge and you receive USDC performance rewards — automatically, onchain, every 7\u00a0days.',
      },
      {
        id: 'create-account',
        question: 'Do I need to create an account?',
        answer: 'You connect your Hyperliquid wallet at app.hyperscaled.trade. No email address, no username, no\u00a0password. Your wallet is your\u00a0identity.',
      },
      {
        id: 'countries-eligible',
        question: 'Which countries are eligible?',
        answer: 'All countries. There are no geographic restrictions on participation. KYC is required only to receive payouts — it is a brief identity verification, not a passport scan or bank account\u00a0requirement.',
      },
    ],
  },
  {
    category: 'The Challenge',
    items: [
      {
        id: 'how-challenge-works',
        question: 'How does the one-step challenge work?',
        answer: 'Select an account size ($5K, $10K, $25K, $50K, or $100K), pay the one-time registration fee, and start trading on Hyperliquid. Hyperscaled reads your public trade data and mirrors it into a simulated scaled account. Hit a 10% profit target while keeping your daily drawdown under 5% to\u00a0pass.',
      },
      {
        id: 'time-limit',
        question: 'Is there a time limit to pass the challenge?',
        answer: 'No. Take as long as you\u00a0need.',
      },
      {
        id: 'daily-loss-limit',
        question: 'What is the daily loss limit?',
        answer: 'Your account equity cannot drop more than 5% from the day\'s opening equity at any point during the trading day. The day resets at 00:00\u00a0UTC.',
      },
      {
        id: 'eod-trailing',
        question: 'What is the EOD trailing loss limit?',
        answer: 'End-of-day account equity cannot drop more than 5% from your end-of-day high water\u00a0mark.',
      },
      {
        id: 'news-trading',
        question: 'Can I trade during news events?',
        answer: 'Yes. News trading is explicitly allowed with no\u00a0restrictions.',
      },
      {
        id: 'algo-trading',
        question: 'Can I trade algorithmically?',
        answer: 'Yes. Any trading strategy is permitted, including algorithmic and automated\u00a0approaches.',
      },
      {
        id: 'breach-drawdown',
        question: 'What happens if I breach a drawdown rule?',
        answer: 'Your challenge is terminated immediately. You can re-register and start a new challenge at any time by paying the registration fee\u00a0again.',
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
        answer: 'Consistent performance unlocks larger account sizes automatically, up to $2.5M. No application, no additional\u00a0fees.',
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
        answer: 'All perpetuals available on Hyperliquid. There are no market\u00a0restrictions.',
      },
      {
        id: 'trading-pairs',
        question: 'What pairs are available to trade?',
        answer: 'Crypto perpetuals only at launch: BTC, ETH, ADA, XRP, SOL, DOGE, TAO, HYPE, ZEC, BCH, LINK, XMR, and LTC. All available on\u00a0Hyperliquid.',
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
