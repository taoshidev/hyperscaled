const BRANDS = {
  hyperscaled: {
    id: 'hyperscaled',
    name: 'Hyperscaled',
    prefix: '',
    logo: '/hyperscaled-logo.svg',
    mark: '/hyperscaled-mark.svg',
    accentColor: '#00C6A7',
    accentRgb: '0, 198, 167',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: process.env.NEXT_PUBLIC_HYPERSCALED_BASE_URL || 'https://hyperscaled.trade',
    twitter: '@hyperscaledhq',
    socials: {
      twitter: 'https://x.com/hyperscaledhq',
      discord: 'https://discord.gg/hyperscaledhq',
      github: 'https://github.com/taoshidev',
      telegram: 'https://t.me/hyperscaled_bot',
      support: 'mailto:support@hyperscaled.trade',
    },
    accountType: 'scaled',
    firstParty: true,
    freeTierCap: 1000,
    showExtension: true,
    showBetaBadge: false,
    showLiquidCrystal: true,
    showPartnersCTA: true,
    heroEyebrow: 'Built on Hyperliquid · Powered by Bittensor',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to $400K. Built on the most advanced decentralized prop trading infrastructure in the world.',
    poweredBy: { name: 'Bittensor', url: 'https://bittensor.com' },
  },
  bitcast: {
    id: 'bitcast',
    name: 'Hyperstack',
    prefix: '/bitcast',
    logo: '/hyperstack-logo.svg',
    mark: '/hyperstack-mark.svg',
    accentColor: '#97FCE4',
    accentRgb: '151, 252, 228',
    tagline: 'Scaled Perp Trading on Hyperliquid',
    siteUrl: 'https://hyperstack.trade',
    twitter: '@hyper_stack',
    socials: {
      twitter: 'https://x.com/hyper_stack',
      discord: null,
      github: null,
      telegram: null,
      support: 'mailto:support@hyperstack.trade',
    },
    accountType: 'scaled',
    freeTierCap: 200,
    showExtension: true,
    chromeExtensionUrl: 'https://chromewebstore.google.com/detail/hyperstack/miejaknkngbdcpkafgkkfgiggkcggedc',
    // Homepage video section, rendered after How It Works and above the pricing cards.
    homeVideo: { id: '5TuSWRPsVEs', title: 'How Hyperstack Works' },
    showBetaBadge: false,
    showLiquidCrystal: true,
    heroBeams: true,
    showPartnersCTA: false,
    parentSite: null,
    heroEyebrow: 'Built on Hyperliquid · Powered by Vanta',
    heroSub: 'Trade perps on Hyperliquid through a Vanta-powered simulated scaled account. Pass the one-step Challenge and scale your account up to $400K.',
    poweredBy: { name: 'Vanta', url: 'https://vantatrading.io' },
    footerTagline: 'A Vanta-powered, partner-branded simulated trading experience.',
    competitorLabel: 'Legacy Prop Firms',
    heroStats: [
      { value: '1-Step', label: 'Challenge' },
      { value: '90%', label: 'Rewards Split' },
      { value: '$400K', label: 'Max Scale' },
    ],
    // ── Compliance (Vanta AMPA + Bitcast/Hyperstack Marketing Guide) ──
    // Operator + protocol attribution. The Challenge is operated by Vanta
    // (Taoshi VT Services); Hyperstack is an Authorized Marketing Partner.
    operatorName: 'Vanta',
    operatorLegalName: 'Vanta (Taoshi VT Services)',
    protocolName: "Vanta's autonomous onchain protocol",
    compliance: {
      // Self-attributed: copy names the brand itself (not "Vanta's protocol") as
      // the thing reading trades, and the brand presents its own 90/10 split.
      selfAttributed: true,
      // Pricing-page hero title (brand-divergent; see PricingPage.jsx).
      pricingHeroTitle: 'One fee. One challenge. Your simulated scaled trading account.',
      // Reward-split copy fragments. Exact strings (not templated) because this is
      // legal-reviewed copy; consumed by Solution/PricingPage/RulesPage/HowItWorks/
      // step-select-tier in place of the former brand.id === 'bitcast' branches.
      reward: {
        label: '90/10 — you keep 90%',          // comparison-table cell + hsBest
        short: 'You keep 90%',                    // compact key-detail value
        compareLabel: 'Performance Split',        // comparison-table row label
        compareFtmo: 'Often 80/20',               // comparison-table competitor cell
        bullet: 'You keep 90% of performance-based rewards',  // pricing bullet + tier-select subhead
        payoutTail: 'you keep 90%.',         // HowItWorks payout step body tail
        ruleParameter:
          'Hyperstack uses a 90/10 performance split: you keep 90% of eligible performance-based rewards. Rewards are independent-contractor compensation based on simulated performance, not a share of real trading profits.',
      },
      // §1.5 — status line shown near every primary CTA
      statusLine:
        'Hyperstack is an Authorized Marketing Partner of Vanta — a Vanta Powered Partner.',
      // §1.3 — four required disclosures, shown near every primary CTA
      disclosures: [
        'The Vanta Trading Challenge is operated by Vanta (Taoshi VT Services), a Cayman Islands company.',
        'Simulated trading only. No funded or live trading account is created or provided.',
        'Payments are made to Vanta or its approved payment processor.',
        'Hyperstack is an Authorized Marketing Partner of Vanta and may receive a marketing fee.',
      ],
      // §1.4 — no-guarantee line, required wherever payout/scaling/rewards appear
      noGuarantee:
        'Passing a Challenge does not guarantee an invitation to the Scaled Trader Program or any compensation.',
      // §1.2 — reward framing (90/10 trader-first; conservative interim wording for Vanta review)
      rewardLine:
        'Hyperstack uses a 90/10 performance split: you keep 90% of eligible performance-based rewards for invited Scaled Trader Program participants, paid in USDC as independent-contractor compensation. Rewards are based on simulated performance and are not a share of real trading profits.',
      // §1.8 — full Schedule 3.A disclosure block, shown in footer + near checkout
      footerBlock:
        'Hyperstack is an Authorized Marketing Partner of Vanta and offers a Vanta-powered, partner-branded experience. The Vanta Trading Challenge is operated by Vanta and is subject to Vanta’s Terms of Service, Challenge Rules, Offer Terms, and Privacy Policy. Payments are made to Vanta through Vanta-approved payment processors; Hyperstack does not collect payments, handle refunds, or make payout or eligibility decisions. All trading is simulated using simulated assets; no real securities, commodities, forex, cryptocurrency, or other assets are traded on the platform. The Challenge is not an investment, not investment advice, and not a funded or live trading account. Challenge results are hypothetical. Passing a Challenge does not guarantee an invitation to the Scaled Trader Program or any compensation. Hyperstack may receive a marketing fee from Vanta if you purchase through this page. If this page uses “prop firm,” “prop trading,” or similar shorthand, that shorthand refers only to a Vanta-powered simulated prop trading evaluation experience and does not mean Hyperstack or Vanta provides funded accounts, live trading accounts, real trading capital, or guaranteed payouts.',
    },
    // §2.5 — compliant FAQ answers (keyed by FAQ item id; consumed by FAQ.jsx
    // and FAQAccordion.jsx, which prefer these over the shared constants for
    // brands that define faqOverrides). Recharacterizes profit-split / payout /
    // KYC / refund answers; defers payment + refund authority to Vanta.
    faqOverrides: {
      'what-is-hyperscaled': {
        question: 'What is Hyperstack?',
        answer: 'Hyperstack is an Authorized Marketing Partner of Vanta — a Vanta Powered Partner. It is a Vanta-powered, partner-branded way to take the Vanta Trading Challenge, a simulated trading evaluation operated by Vanta (Taoshi VT Services). You trade on Hyperliquid with your own wallet and your performance is evaluated against a simulated scaled account. There is no funded or live trading account and no real-money payouts. Traders who pass may be invited into Vanta’s Scaled Trader Program, where performance-based rewards are paid as independent-contractor compensation.',
      },
      'countries-eligible': {
        answer: 'Eligibility is determined by Vanta and its approved jurisdictions. The Challenge is currently offered in English to participants in approved jurisdictions and is void where prohibited. KYC is required by Vanta before any payout.',
      },
      'how-challenge-works': {
        answer: 'Select an account size (free $1K, or paid $5K, $10K, $25K, $50K, or $100K), pay the one-time registration fee to Vanta, and start trading on Hyperliquid. Vanta’s protocol reads your public trade data and mirrors it into a simulated scaled account. Hit a 10% profit target while staying within both the 5% daily loss limit and 5% EOD trailing loss limit to pass. The Challenge uses simulated assets only — no funded or live trading account is created.',
      },
      'what-changes-scaled': {
        answer: 'On a simulated scaled account the profit target is removed. Your daily loss limit stays at 5%, while the EOD trailing loss limit widens to 8% (from 5% during the Challenge). Invited Scaled Trader Program participants may receive monthly USDC rewards based on simulated performance, paid by Vanta as independent-contractor compensation. Rewards are not guaranteed.',
      },
      'when-paid': {
        question: 'When and how are rewards paid?',
        answer: 'Rewards apply only to traders invited into Vanta’s Scaled Trader Program after passing the Challenge. Performance-based rewards are calculated at the end of each monthly cycle and paid in USDC by Vanta to your connected wallet as independent-contractor compensation — not a share of real trading profits. Passing a Challenge does not guarantee an invitation to the Scaled Trader Program or any compensation.',
      },
      'profit-split': {
        question: 'How are rewards determined?',
        answer: 'Hyperstack uses a 90/10 performance split: you keep 90% of eligible performance-based rewards for invited Scaled Trader Program participants. Rewards are based on simulated performance and paid as independent-contractor compensation, not a share of real trading profits. Passing a Challenge does not guarantee an invitation to the Scaled Trader Program or any compensation.',
      },
      'profit-target-scaled': {
        question: 'Do I need to hit a profit target to receive rewards?',
        answer: 'No. For invited Scaled Trader Program participants, performance-based rewards are based on simulated performance during the monthly cycle; there is no minimum profit target. Rewards are independent-contractor compensation paid by Vanta and are not guaranteed.',
      },
      'scaling-works': {
        answer: 'Scaling is automatic and based on simulated performance thresholds — no application, no additional fees — and is administered by Vanta’s autonomous onchain protocol. To qualify for an account-size increase you need a 5% quarterly return on your current simulated account size and an all-time Sharpe ratio greater than 1, up to a maximum of $400K. Scaling and any associated rewards are determined by Vanta and are not guaranteed.',
      },
      'kyc-required': {
        answer: 'No KYC is required to register or trade. KYC is required by Vanta only before your first payout. Vanta (not Hyperstack) collects and processes this identity verification through its provider — no trading history or bank details required.',
      },
      'why-kyc': {
        answer: 'Payout KYC is a compliance requirement applied by Vanta for USDC distribution (AML and sanctions screening) before any transfer. Hyperstack does not handle KYC or payouts — Vanta does. It has no bearing on your ability to take the Challenge or trade.',
      },
      'what-built-on': {
        answer: 'The Vanta Trading Challenge is operated by Vanta (Taoshi VT Services) and built natively on Hyperliquid using Vanta’s autonomous onchain protocol. All payouts are made by Vanta in USDC and are verifiable onchain.',
      },
      'api-keys': {
        answer: 'No. Vanta’s protocol reads your trade data from Hyperliquid’s public data stream via websockets. No API keys, no custody permissions, no access to your account controls.',
      },
      // PRICING_FAQ — refund/fee authority belongs to Vanta, not the Partner
      'fee-refundable': {
        answer: 'Registration fees are set, collected, and processed by Vanta. Refund eligibility, if any, is governed by Vanta’s Offer Terms and Terms of Service. Hyperstack does not collect payments or handle refunds.',
      },
      'other-fees': {
        answer: 'Fees are set and collected by Vanta. See Vanta’s Offer Terms for the current fee schedule. Hyperstack does not set pricing or process payments.',
      },
      'retry-challenge': {
        answer: 'Yes. You can re-register at any time; registration is processed by Vanta. There is no limit on retries.',
      },
    },
  },
  lunarcrush: {
    id: 'lunarcrush',
    name: 'LunarCrush',
    prefix: '/lunarcrush',
    logo: '/lunarcrush-logo.svg',
    accentColor: '#8b5cf6',
    accentRgb: '139, 92, 246',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: 'https://lunarcrush.com',
    twitter: '@lunarcrush',
    socials: {
      twitter: 'https://x.com/lunarcrush',
      discord: null,
      github: null,
      telegram: 'https://t.me/lunarcrush',
      youtube: 'https://youtube.com/@lunarcrush',
      support: 'mailto:support@lunarcrush.com',
    },
    accountType: 'scaled',
    freeTierCap: 1000,
    showExtension: false,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to LunarCrush', url: 'https://lunarcrush.com' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to $400K. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
  beanstock: {
    id: 'beanstock',
    name: 'Beanstock Trading',
    prefix: '/beanstock',
    logo: '/beanstock-logo.svg',
    accentColor: '#62be57',
    accentRgb: '98, 190, 87',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: 'https://beanstocktrading.com',
    twitter: '@jollygreenmoney',
    socials: {
      twitter: 'https://x.com/jollygreenmoney',
      discord: 'https://discord.gg/wSC49Gtjsy',
      github: null,
      telegram: 'https://t.me/beanstockcalls',
      youtube: 'https://www.youtube.com/@getbeanstock',
      support: 'mailto:hello@getbeanstock.com',
    },
    accountType: 'scaled',
    freeTierCap: 1000,
    showExtension: true,
    chromeExtensionUrl: 'https://chromewebstore.google.com/detail/beanstock-trading/dhjhfbabdbmemdengnkojbnlcbjemcak',
    showBetaBadge: false,
    showLiquidCrystal: true,
    showPartnersCTA: false,
    parentSite: { label: 'Back to Beanstock Trading', url: 'https://beanstocktrading.com' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Vanta',
    heroSub: 'Trade on Hyperliquid through a Vanta-powered simulated scaled account. Pass the one-step Challenge and scale your account up to $400K.',
    poweredBy: { name: 'Vanta', url: 'https://vantatrading.io' },
    footerTagline: 'A Vanta-powered, partner-branded simulated trading\u00a0experience.',
    competitorLabel: 'Legacy Prop Firms',
    heroStats: [
      { value: '1-Step', label: 'Challenge' },
      { value: '90%', label: 'Rewards Split' },
      { value: '$400K', label: 'Max Scale' },
    ],
    // ── Compliance (Vanta AMPA + Marketing Guide) ──
    // Underlying Challenge is operated by Vanta (Taoshi VT Services); Beanstock
    // is an Authorized Marketing Partner. Operator attribution = Vanta (per the
    // shared Terms of Service). CONFIRM Beanstock's AMP-of-Vanta status w/ legal.
    operatorName: 'Vanta',
    operatorLegalName: 'Vanta (Taoshi VT Services)',
    protocolName: "Vanta's autonomous onchain protocol",
    compliance: {
      // Vanta-attributed: copy defers to "Vanta's protocol" and frames rewards as
      // "Vanta retains 0%" rather than a brand-owned split.
      selfAttributed: false,
      pricingHeroTitle: 'One fee. One challenge. Vanta-powered simulated scaled account.',
      reward: {
        label: 'Vanta retains 0%',
        short: 'Vanta retains 0%',
        compareLabel: 'Rewards Retained by You',
        compareFtmo: 'Up to 30% retained',
        bullet: 'Vanta retains 0% of performance-based rewards',
        payoutTail: 'Vanta retains 0% of performance-based rewards.',
        ruleParameter:
          'Vanta retains 0% of performance-based rewards. Rewards are independent-contractor compensation based on simulated performance — not a profit split.',
      },
      statusLine:
        'Beanstock is an Authorized Marketing Partner of Vanta — a Vanta Powered Partner.',
      disclosures: [
        'The Vanta Trading Challenge is operated by Vanta (Taoshi VT Services), a Cayman Islands company.',
        'Simulated trading only. No funded or live trading account is created or provided.',
        'Payments are made to Vanta or its approved payment processor.',
        'Beanstock is an Authorized Marketing Partner of Vanta and may receive a marketing fee.',
      ],
      noGuarantee:
        'Passing a Challenge does not guarantee an invitation to the Scaled Trader Program or any compensation.',
      rewardLine:
        'Vanta retains 0% of performance-based rewards for invited Scaled Trader Program participants. Rewards are based on simulated performance and paid as independent-contractor compensation, not a share of real trading profits.',
      footerBlock:
        'Beanstock is an Authorized Marketing Partner of Vanta and offers a Vanta-powered, partner-branded experience. The Vanta Trading Challenge is operated by Vanta and is subject to Vanta’s Terms of Service, Challenge Rules, Offer Terms, and Privacy Policy. Payments are made to Vanta through Vanta-approved payment processors; Beanstock does not collect payments, handle refunds, or make payout or eligibility decisions. All trading is simulated using simulated assets; no real securities, commodities, forex, cryptocurrency, or other assets are traded on the platform. The Challenge is not an investment, not investment advice, and not a funded or live trading account. Challenge results are hypothetical. Passing a Challenge does not guarantee an invitation to the Scaled Trader Program or any compensation. Beanstock may receive a marketing fee from Vanta if you purchase through this page. If this page uses “prop firm,” “prop trading,” or similar shorthand, that shorthand refers only to a Vanta-powered simulated prop trading evaluation experience and does not mean Beanstock or Vanta provides funded accounts, live trading accounts, real trading capital, or guaranteed payouts.',
    },
    faqOverrides: {
      'what-is-hyperscaled': {
        question: 'What is Beanstock?',
        answer: 'Beanstock is an Authorized Marketing Partner of Vanta — a Vanta Powered Partner. It is a Vanta-powered, partner-branded way to take the Vanta Trading Challenge, a simulated trading evaluation operated by Vanta (Taoshi VT Services). You trade on Hyperliquid with your own wallet and your performance is evaluated against a simulated scaled account. There is no funded or live trading account and no real-money payouts. Traders who pass may be invited into Vanta’s Scaled Trader Program, where performance-based rewards are paid as independent-contractor compensation.',
      },
      'countries-eligible': {
        answer: 'Eligibility is determined by Vanta and its approved jurisdictions. The Challenge is currently offered in English to participants in approved jurisdictions and is void where prohibited. KYC is required by Vanta before any payout.',
      },
      'how-challenge-works': {
        answer: 'Select an account size (free $1K, or paid $5K, $10K, $25K, $50K, or $100K), pay the one-time registration fee to Vanta, and start trading on Hyperliquid. Vanta’s protocol reads your public trade data and mirrors it into a simulated scaled account. Hit a 10% profit target while staying within both the 5% daily loss limit and 5% EOD trailing loss limit to pass. The Challenge uses simulated assets only — no funded or live trading account is created.',
      },
      'what-changes-scaled': {
        answer: 'On a simulated scaled account the profit target is removed. Your daily loss limit stays at 5%, while the EOD trailing loss limit widens to 8% (from 5% during the Challenge). Invited Scaled Trader Program participants may receive monthly USDC rewards based on simulated performance, paid by Vanta as independent-contractor compensation. Rewards are not guaranteed.',
      },
      'when-paid': {
        question: 'When and how are rewards paid?',
        answer: 'Rewards apply only to traders invited into Vanta’s Scaled Trader Program after passing the Challenge. Performance-based rewards are calculated at the end of each monthly cycle and paid in USDC by Vanta to your connected wallet as independent-contractor compensation — not a share of real trading profits. Passing a Challenge does not guarantee an invitation to the Scaled Trader Program or any compensation.',
      },
      'profit-split': {
        question: 'How are rewards determined?',
        answer: 'Vanta retains 0% of performance-based rewards for invited Scaled Trader Program participants. Rewards are based on simulated performance and paid as independent-contractor compensation, not a share of real trading profits. Passing a Challenge does not guarantee an invitation to the Scaled Trader Program or any compensation.',
      },
      'profit-target-scaled': {
        question: 'Do I need to hit a profit target to receive rewards?',
        answer: 'No. For invited Scaled Trader Program participants, performance-based rewards are based on simulated performance during the monthly cycle; there is no minimum profit target. Rewards are independent-contractor compensation paid by Vanta and are not guaranteed.',
      },
      'scaling-works': {
        answer: 'Scaling is automatic and based on simulated performance thresholds — no application, no additional fees — and is administered by Vanta’s autonomous onchain protocol. To qualify for an account-size increase you need a 5% quarterly return on your current simulated account size and an all-time Sharpe ratio greater than 1, up to a maximum of $400K. Scaling and any associated rewards are determined by Vanta and are not guaranteed.',
      },
      'kyc-required': {
        answer: 'No KYC is required to register or trade. KYC is required by Vanta only before your first payout. Vanta (not Beanstock) collects and processes this identity verification through its provider — no trading history or bank details required.',
      },
      'why-kyc': {
        answer: 'Payout KYC is a compliance requirement applied by Vanta for USDC distribution (AML and sanctions screening) before any transfer. Beanstock does not handle KYC or payouts — Vanta does. It has no bearing on your ability to take the Challenge or trade.',
      },
      'what-built-on': {
        answer: 'The Vanta Trading Challenge is operated by Vanta (Taoshi VT Services) and built natively on Hyperliquid using Vanta’s autonomous onchain protocol. All payouts are made by Vanta in USDC and are verifiable onchain.',
      },
      'api-keys': {
        answer: 'No. Vanta’s protocol reads your trade data from Hyperliquid’s public data stream via websockets. No API keys, no custody permissions, no access to your account controls.',
      },
      'fee-refundable': {
        answer: 'Registration fees are set, collected, and processed by Vanta. Refund eligibility, if any, is governed by Vanta’s Offer Terms and Terms of Service. Beanstock does not collect payments or handle refunds.',
      },
      'other-fees': {
        answer: 'Fees are set and collected by Vanta. See Vanta’s Offer Terms for the current fee schedule. Beanstock does not set pricing or process payments.',
      },
      'retry-challenge': {
        answer: 'Yes. You can re-register at any time; registration is processed by Vanta. There is no limit on retries.',
      },
    },
  },
  vanta: {
    id: 'vanta',
    name: 'Vanta Trading',
    prefix: '/vanta',
    logo: '/vanta-logo.svg',
    mark: '/vanta-mark.svg',
    accentColor: '#ffffff',
    accentRgb: '255, 255, 255',
    tagline: 'Scaled Trading on Hyperliquid',
    siteUrl: 'https://vantatrading.io',
    twitter: '@vantatrading',
    socials: {
      twitter: 'https://x.com/vantatrading',
      discord: 'https://discord.gg/vantatrading',
      github: 'https://github.com/taoshidev',
      telegram: 'https://t.me/hyperscaled_bot',
      support: 'mailto:support@vantatrading.io',
    },
    accountType: 'scaled',
    firstParty: true,
    freeTierCap: 1000,
    showExtension: true,
    showBetaBadge: false,
    showLiquidCrystal: false,
    showPartnersCTA: false,
    parentSite: { label: 'Back to Vanta Trading', url: 'https://vantatrading.io' },
    heroEyebrow: 'Built on Hyperliquid · Powered by Hyperscaled',
    heroSub: 'Trade with more capital without risking your own stack. Keep 100% of your profits and grow your account to $400K. Built on Vanta, the most advanced decentralized prop trading infrastructure in the world. Powered by Hyperscaled.',
    poweredBy: { name: 'Hyperscaled', url: 'https://hyperscaled.trade' },
  },
}

export function getBrandConfig(brandId) {
  return BRANDS[brandId] || BRANDS.hyperscaled
}

export function brandifyText(text, brand) {
  if (!text || brand.id === 'hyperscaled') return text
  let result = text
  if (brand.accountType !== 'scaled') {
    result = result
      .replace(/\bscaled account/g, `${brand.accountType} account`)
      .replace(/\bscaled accounts/g, `${brand.accountType} accounts`)
      .replace(/\bscaled trader/g, `${brand.accountType} trader`)
      .replace(/\bscaled traders/g, `${brand.accountType} traders`)
      .replace(/\bscaled trading/g, `${brand.accountType} trading`)
      .replace(/\bscaled capital/g, `${brand.accountType} capital`)
      .replace(/\baccounts scaled/g, `accounts ${brand.accountType}`)
      .replace(/\bI'm scaled/g, `I'm ${brand.accountType}`)
      .replace(/\bOnce scaled/g, `Once ${brand.accountType}`)
      .replace(/\bwhen scaled/g, `when ${brand.accountType}`)
  }
  result = result
    .replace(/app\.hyperscaled\.trade/g, brand.siteUrl.replace('https://', ''))
    .replace(/\bHyperscaled/g, brand.name)

  // Compliance safety-net for brands carrying a compliance config. Catches
  // banned-term leakage in shared copy not covered by an explicit override.
  if (brand.compliance) {
    result = result
      .replace(/Funded Accounts & Payouts/g, 'Scaled Accounts & Rewards')
      .replace(/Funded Account/g, 'Simulated scaled account')
      .replace(/funded account/g, 'simulated scaled account')
  }

  return result
}

export { BRANDS }
