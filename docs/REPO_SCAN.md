# Hyperscaled Repo Scan — 2026-03-16

## Route Status

| Route | Exists | Has Content | Has Metadata | Layout/Providers | Type | Spec Match | Notes |
|-------|--------|-------------|-------------|------------------|------|------------|-------|
| `/` (home) | ✅ | ✅ | ✅ (root layout) | No Providers (correct) | Dynamic (force-dynamic) | ✅ | Renders all marketing sections via `components/marketing.jsx` |
| `/how-it-works` | ❌ | — | — | — | — | ❌ Missing | No dedicated page — exists only as `#how-it-works` anchor on home |
| `/pricing` | ❌ | — | — | — | — | ❌ Missing | No page. Pricing only exists inside `/register` tier selection |
| `/rules` | ❌ | — | — | — | — | ❌ Missing | Nav links to `href="#"` (dead link). No page exists |
| `/leaderboard` | ✅ | ✅ | ❌ No metadata export | No Providers wrapper | Static (client-side) | ⚠️ Partial | Uses `Leaderboard` + `TraderDashboard` components. No page-level metadata. No layout.jsx (no Providers despite ARCHITECTURE.md saying it should have them) |
| `/partners` | ❌ | — | — | — | — | ❌ Missing | No page exists |
| `/faq` | ❌ | — | — | — | — | ❌ Missing | No dedicated page — exists only as `#faq` anchor on home |
| `/register` | ✅ | ✅ | ✅ | Providers ✅ | Dynamic | ✅ | Full 3-step registration flow |
| `/dashboard` | ✅ | ✅ | ✅ | Providers ✅ | Dynamic | ✅ | Full trader dashboard |
| `/miner/[slug]` | ✅ | ✅ | ✅ (dynamic) | Providers ✅ | Dynamic | ✅ | Renders RegistrationFlow with miner data |
| `/status` | ✅ | ✅ | ✅ | Providers ✅ | Dynamic | ✅ | Status checker component |

**Summary: 6/11 spec routes exist. 5 missing: `/how-it-works`, `/pricing`, `/rules`, `/partners`, `/faq`.**

---

## Component Inventory

### Marketing (`components/marketing/`)

| File | Section/Purpose | Lines | Issues |
|------|----------------|-------|--------|
| `Nav.jsx` | Global navigation bar | 98 | Nav links don't match spec (see Nav Audit below). "Rules" links to `href="#"` (dead). |
| `Hero.jsx` | Hero section with CTA | 234 | Links to `/extension` (dead route). "Chrome Extension" CTA has no real destination. Hero sub-copy says "Keep 100% of your profits" — potential compliance issue. `text-[10px]` used 12 times (violates 12px min rule). |
| `Stats.jsx` | Network stats counter cards | 168 | Stats hardcoded in component, not centralized in constants. "100%" stat (max profit split). |
| `Problem.jsx` | Pain points of legacy prop firms | 136 | `body2` contains "100% payouts" claim. Uses `transition-all` (line 88). `text-[10px]` ×1. |
| `Solution.jsx` | Protocol pillars + comparison table | 183 | Comparison table has "Up to 100%" for profit split. KYC pillar says "Cryptographic KYC" but FAQ says Privado. |
| `HowItWorks.jsx` | 3-step onboarding flow | 233 | Step 1 mockup references "Vanta Trading" as a prop firm name. Step 2 says "Install the Chrome Extension" prominently. `transition-all` (line 115). `text-[10px]` ×4. |
| `Features.jsx` | Bento grid feature cards | 209 | "we bring the funding" in Trade on Hyperliquid card — borderline compliance. `transition-all` (line 178). `text-[10px]` ×3. |
| `FAQ.jsx` | Accordion FAQ | 136 | FAQ data hardcoded in component, not in constants. Mentions Privado for KYC. |
| `Footer.jsx` | Footer with links + social | 133 | "Built on Bittensor" in tagline. `transition-all` (line 48). Copyright says "2025" — should be 2026. Social links all go to `href="#"` (dead). |
| `Leaderboard.jsx` | Leaderboard table (used on `/` and `/leaderboard`) | 275 | References "Vanta Network" (line 118). Fallback mock data hardcoded. Fetches from `/api/leaderboard`. `text-[10px]` ×6. |
| `LiquidCrystalBg.jsx` | WebGL2 animated background | 161 | No issues. |
| `ShinyButton.jsx` | Gradient CTA button wrapper | 20 | No issues. Thin wrapper around `.shiny-cta` class. |
| `WaitlistForm.jsx` | Email capture form | 109 | `transition-all` (line 52). Simulated submission (no real endpoint). |
| `TraderDashboard.jsx` | Full-screen trader detail overlay | 325 | All data hardcoded. References "Vanta Network Dashboard" would appear via leaderboard. `text-[10px]` ×14. |

### Marketing Orchestrator (`components/marketing.jsx`)

| File | Purpose | Lines | Issues |
|------|---------|-------|--------|
| `marketing.jsx` | Composes all home page sections | 29 | Accepts `lockedMiner` prop but doesn't use it visibly. No Leaderboard section rendered on home page (Leaderboard component exists but isn't in the compose list). |

### Dashboard (`components/dashboard/`)

| File | Purpose | Lines | Issues |
|------|---------|-------|--------|
| `dashboard.jsx` | Dashboard orchestrator | 151 | Uses `min-h-screen` (should be `min-h-[100dvh]`). Includes KYC verification. |
| `account-overview.jsx` | Account balance + drawdown | 118 | `transition-all` ×2 (lines 40, 52). |
| `stats-panel.jsx` | Trading stats grid | 130 | No issues. |
| `open-positions.jsx` | Open positions table | 63 | No issues. |
| `pending-orders.jsx` | Pending orders table | 44 | No issues. |
| `trade-history.jsx` | Trade history table | 89 | No issues. |
| `order-events.jsx` | SSE order event feed | 59 | No issues. |
| `connection-status.jsx` | WebSocket connection indicator | 28 | No issues. |
| `kyc-verification.jsx` | SumSub KYC widget | 179 | New file. Uses `@sumsub/websdk-react`. |

### Registration (`components/registration/`)

| File | Purpose | Lines | Issues |
|------|---------|-------|--------|
| `registration-flow.jsx` | 3-step flow orchestrator | 110 | No issues. |
| `step-select-tier.jsx` | Tier selection cards | 215 | No issues. |
| `step-connect-pay.jsx` | Wallet connect + USDC payment | 431 | References `VANTA_USDC_WALLET` (lines 27, 93). |
| `step-payment.jsx` | Alternative payment step | 265 | New file. Appears to be a second payment implementation. |
| `step-confirmation.jsx` | Success + Chrome extension CTA | 464 | References "Vanta Network Dashboard" (line 194). References "Vanta Network" (line 302). Chrome extension CTA (lines 382, 396). |
| `stepper.jsx` | Step progress indicator | 93 | No issues. |

### Status (`components/status/`)

| File | Purpose | Lines | Issues |
|------|---------|-------|--------|
| `status-checker.jsx` | Registration status lookup | 175 | Uses `min-h-screen` (should be `min-h-[100dvh]`). |

### UI Primitives (`components/ui/`)

| File | Purpose | Lines | Issues |
|------|---------|-------|--------|
| `button.jsx` | CVA button variants | 38 | No issues. |
| `card.jsx` | Card container | 34 | No issues. |
| `dialog.jsx` | Radix dialog | 74 | No issues. |
| `input.jsx` | Input field | 19 | No issues. |

---

## Compliance Violations

### "Vanta" References (should be "Hyperscaled" throughout)

| File:Line | Text Found |
|-----------|------------|
| `components/marketing/HowItWorks.jsx:15` | `name: 'Vanta Trading'` (prop firm mockup) |
| `components/marketing/Leaderboard.jsx:118` | `Aggregated across all of Vanta Network` |
| `components/registration/step-confirmation.jsx:194` | `Vanta Network Dashboard` |
| `components/registration/step-confirmation.jsx:302` | `provisioned on Vanta Network` |
| `components/registration/step-connect-pay.jsx:27` | `VANTA_USDC_WALLET` import |
| `components/registration/step-connect-pay.jsx:93` | `args: [VANTA_USDC_WALLET, amount]` |
| `lib/constants.js:72-74` | `VANTA_USDC_WALLET` constant name |
| `lib/db/seed.js:20-23` | `name: "Vanta Trading"`, `slug: "vanta"` |
| `endpoint_docs.md:1,3` | `Vanta Network API Endpoints` |

### "Built on Bittensor" References

| File:Line | Text Found |
|-----------|------------|
| `components/marketing/Footer.jsx:41` | `Permissionless funded trading on Hyperliquid. Built on Bittensor.` |
| `components/marketing/Footer.jsx:101-109` | `Powered by Bittensor` with link |
| `components/marketing/Hero.jsx:52` | `Built on Hyperliquid · Powered by Bittensor` (eyebrow badge) |

### "Up to 100%" Profit Claims

| File:Line | Text Found |
|-----------|------------|
| `components/marketing/Solution.jsx:45` | `'Up to 100%'` in comparison table |
| `components/marketing/Solution.jsx:51` | `'Up to 100%'` in hsBest array |

### Chrome Extension References

| File:Line | Text Found |
|-----------|------------|
| `components/marketing/Hero.jsx:91` | `Chrome Extension` CTA button linking to `/extension` (dead route) |
| `components/marketing/HowItWorks.jsx:149` | `'Install the Chrome Extension'` as Step 2 title |
| `components/registration/step-confirmation.jsx:382` | `Install the Chrome extension to start trading` |
| `components/registration/step-confirmation.jsx:396` | `Install Chrome Extension` button |

### Design Rule Violations

| File:Line | Violation | Detail |
|-----------|-----------|--------|
| 7 component files (41 instances) | `text-[10px]` | Violates 12px minimum text size rule. Most in Hero, TraderDashboard, Leaderboard. |
| 5 files (7 instances) | `transition-all` | Violates "only animate transform + opacity" rule. Should use specific properties. |
| 6 instances in dashboard/status | `min-h-screen` | Should be `min-h-[100dvh]` per design rules. |
| `components/marketing/Footer.jsx:91` | Copyright year | Says "2025", should be "2026". |

---

## Nav Status

**Current nav links:**
1. `Protocol` → `#solution`
2. `How It Works` → `#how-it-works`
3. `Features` → `#features`
4. `FAQ` → `#faq`
5. `Leaderboard` → `/leaderboard`
6. `Dashboard` → `/dashboard`
7. `Rules` → `#` (dead link)
8. `Status` → `/status`

**CTA button:** "Start Evaluation" → `/register` ✅
**Search input:** Yes, HL address search ✅

**Spec requires:** How It Works · Pricing · Rules · Leaderboard · Partners · FAQ

**Delta:**
- ❌ `Pricing` — not in nav, no page exists
- ❌ `Partners` — not in nav, no page exists
- ❌ `Rules` — in nav but links to `#` (dead)
- ⚠️ `Protocol` in nav but not in spec
- ⚠️ `Features` in nav but not in spec
- ⚠️ `Dashboard` in nav but not in spec
- ⚠️ `Status` in nav but not in spec

---

## Footer Status

**Current column structure:**
1. **Brand column** — Logo, tagline ("Permissionless funded trading on Hyperliquid. Built on Bittensor."), social icons (Twitter, Discord, GitHub — all `href="#"`)
2. **Protocol** — How It Works, Features, Leaderboard, Evaluation Rules, Docs (external)
3. **Community** — Twitter/X, Discord, GitHub (all external, all `href="#"` effectively)
4. **Legal** — Terms of Service, Privacy Policy, Risk Disclosure, Audit Report

**Bottom bar:**
- Copyright: `© 2025 Hyperscaled Protocol` — **year is wrong** (should be 2026)
- Built on Hyperliquid · Powered by Bittensor
- Audit Report link + Source Code link

**Social links present?** Yes, but icons in brand column all go to `href="#"` (dead). Community column links have proper external URLs but are likely placeholder domains.

**"Powered by Bittensor" present?** ✅ Yes, in bottom bar.

**Spec match:** Partial. Missing Pricing and Partners links. Dead social links. Wrong year.

---

## Home Page Sections (in render order)

| # | Component | Section | Key Copy | Spec Match | Issues |
|---|-----------|---------|----------|------------|--------|
| 1 | `Nav` | Navigation | "Start Evaluation" CTA | ⚠️ | Links don't match spec (see Nav Audit) |
| 2 | `Hero` | Hero + CTA | "Permissionless Funded Trading on Hyperliquid" | ⚠️ | "Built on Hyperliquid · Powered by Bittensor" eyebrow. "Chrome Extension" secondary CTA links to dead `/extension` route. "Keep 100% of your profits" claim. |
| 3 | `Stats` | Network statistics | "$1B+ Network Volume" | ✅ | Stats hardcoded in component, not centralized |
| 4 | `Problem` | Pain points | "Prop firms take up to 30%. Then ghost you on payouts." | ✅ | "100% payouts" claim in body2 |
| 5 | `Solution` | Protocol pillars + comparison | "Permissionless. Open-Source. Onchain." | ⚠️ | "Up to 100%" in comparison table. "Cryptographic KYC" copy conflicts with FAQ (Privado) |
| 6 | `HowItWorks` | 3-step process | "Trade on Hyperliquid. Get funded by the network." | ⚠️ | "Vanta Trading" in Step 1 mockup. "Chrome Extension" is Step 2. |
| 7 | `Features` | Feature bento grid | "Built for traders who trade with an edge." | ⚠️ | "we bring the funding" (Features card #5) |
| 8 | `FAQ` | FAQ accordion | "Questions traders actually ask." | ✅ | Data hardcoded, not in constants |
| 9 | `Footer` | Footer | "© 2025 Hyperscaled Protocol" | ⚠️ | Wrong year. Dead social links. "Built on Bittensor." |

**Note:** Leaderboard component exists but is **NOT rendered on the home page** despite `BUILD_STATE.md` marking "Leaderboard preview" as Done. It's only used on `/leaderboard`.

---

## Shared Data

| Constant | Exists | Location | Notes |
|----------|--------|----------|-------|
| `TIERS` | ✅ | `lib/constants.js` | 3 tiers (Starter, Pro, Elite) with promo pricing |
| `USDC_ADDRESS` | ✅ | `lib/constants.js` | Testnet/mainnet toggle |
| `VANTA_USDC_WALLET` | ✅ | `lib/constants.js` | **Named "VANTA"** — should be renamed. Defaults to zero address. |
| `CHROME_EXTENSION_URL` | ✅ | `lib/constants.js` | Points to real Chrome Web Store URL |
| `BASESCAN_URL` | ✅ | `lib/constants.js` | Testnet/mainnet toggle |
| Scaling path constant | ❌ | — | Hardcoded in `Features.jsx` as `$100K → $2.5M` |
| FAQ data | ❌ centralized | `FAQ.jsx` | Hardcoded in component, not in constants |
| Pricing data | ❌ beyond tiers | `lib/constants.js` | Only registration tiers. No standalone pricing page data. |
| Network stats | ❌ centralized | `Stats.jsx`, `Hero.jsx` | Hardcoded independently in each component. Different values possible. |
| Miner data | ✅ | `lib/miners.js` | Mock miners for leaderboard/registration |

---

## Build Status

**Clean:** ✅ Yes — builds successfully with no errors.

**Warnings:**
- ESLint: "The Next.js plugin was not detected in your ESLint configuration" (minor config issue)

**Errors:** None

**Build output:** All 16 pages generated. Middleware at 34.1 kB. First Load JS for home is 183 kB.

---

## Key Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| `next` | ^15.3.3 | ✅ Current |
| `react` | ^19.2.0 | ✅ Current |
| `tailwindcss` | ^4.2.1 | ✅ v4, CSS-based config |
| `framer-motion` | ^12.35.0 | ✅ Current |
| `@tanstack/react-query` | ^5.90.21 | ✅ Current |
| `wagmi` | ^2.19.5 | ✅ Current |
| `viem` | ^2.46.3 | ✅ Current |
| `@rainbow-me/rainbowkit` | ^2.2.10 | ✅ Current |
| `@phosphor-icons/react` | ^2.1.10 | ✅ Current |
| `drizzle-orm` | ^0.45.1 | ✅ New addition (DB layer) |
| `@sumsub/websdk-react` | ^2.6.1 | ✅ New addition (KYC) |
| `@polkadot/util-crypto` | ^14.0.2 | ✅ New addition (auth) |
| `pg` | ^8.19.0 | New — Postgres driver. Requires `DATABASE_URL` env var. |

No outdated or mismatched dependencies detected.

---

## Summary

- **Pages ready:** 6/11 (`/`, `/leaderboard`, `/register`, `/dashboard`, `/miner/[slug]`, `/status`)
- **Pages missing:** `/how-it-works`, `/pricing`, `/rules`, `/partners`, `/faq`
- **Compliance violations:** 26 total
  - 9 "Vanta" references in UI/constants (should be Hyperscaled or removed)
  - 3 "Built on Bittensor" / "Powered by Bittensor" references
  - 2 "Up to 100%" profit claims
  - 4 "Chrome Extension" references (with dead `/extension` route)
  - 41 `text-[10px]` violations (12px minimum rule)
  - 7 `transition-all` violations
  - 6 `min-h-screen` violations (should be `min-h-[100dvh]`)
- **Build status:** ✅ Clean (1 minor ESLint config warning)
- **Biggest gaps:**
  1. **5 marketing pages don't exist** — `/how-it-works`, `/pricing`, `/rules`, `/partners`, `/faq` are all missing
  2. **"Vanta" branding not fully replaced** — 9 references remain in UI components, constants, and seed data
  3. **Nav and Footer don't match marketing spec** — wrong links, dead `href="#"` placeholders, wrong copyright year
  4. **Leaderboard not on home page** — component exists but isn't rendered in the marketing page compose list despite BUILD_STATE saying it's done
  5. **Network stats not centralized** — same numbers hardcoded independently in Hero.jsx and Stats.jsx, risking drift
