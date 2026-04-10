'use client'

import { useEffect, useRef, useState } from 'react'

/* ───────────────────────────────────────────────
   TOC sections definition
   ─────────────────────────────────────────────── */
const TOC_SECTIONS = [
  { id: 'key-terms', label: 'Key Terms' },
  { id: 'definitions', label: 'Definitions' },
  { id: 'service-description', label: 'Service Description' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'fees', label: 'Fees & Payment' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'capital', label: 'Your Capital' },
  { id: 'network-emissions', label: 'Network Emissions' },
  { id: 'evaluation', label: 'Evaluation' },
  { id: 'conduct', label: 'Conduct' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'confidentiality', label: 'Confidentiality' },
  { id: 'data-protection', label: 'Data Protection' },
  { id: 'risk', label: 'Risk Disclosures' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'termination', label: 'Termination' },
  { id: 'modifications', label: 'Modifications' },
  { id: 'disputes', label: 'Dispute Resolution' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'eu-uk', label: 'EU/UK Rights' },
  { id: 'general', label: 'General' },
  { id: 'contact', label: 'Contact' },
]

/* ───────────────────────────────────────────────
   Sticky TOC (desktop sidebar + mobile jump bar)
   ─────────────────────────────────────────────── */
function handleTocClick(e, id) {
  e.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth' })
  history.replaceState(null, '', `#${id}`)
}

function TableOfContents({ activeId }) {
  const navRef = useRef(null)

  useEffect(() => {
    function check() {
      if (!navRef.current) return
      const footer = document.querySelector('footer')
      if (!footer) return
      const navBottom = navRef.current.getBoundingClientRect().bottom
      const footerTop = footer.getBoundingClientRect().top
      const hide = footerTop <= navBottom + 24
      navRef.current.style.opacity = hide ? '0' : '1'
      navRef.current.style.pointerEvents = hide ? 'none' : 'auto'
    }
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        ref={navRef}
        className="hidden lg:block fixed left-[max(1rem,calc((100vw-900px)/2-180px))] top-[126px] w-[140px] z-40 transition-opacity duration-300"
        aria-label="Page sections"
      >
        <ul className="space-y-1">
          {TOC_SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleTocClick(e, s.id)}
                className={`block text-xs py-1 transition-colors ${
                  activeId === s.id
                    ? 'text-teal-400 font-medium'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile jump bar */}
      <div className="lg:hidden sticky top-[94px] z-30 bg-[#09090b]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-4 py-2 min-w-max">
            {TOC_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => handleTocClick(e, s.id)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  activeId === s.id
                    ? 'bg-teal-400/10 text-teal-400 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ───────────────────────────────────────────────
   Active section tracker hook
   ─────────────────────────────────────────────── */
function useActiveSection() {
  const [activeId, setActiveId] = useState('key-terms')

  useEffect(() => {
    const ids = TOC_SECTIONS.map((s) => s.id)
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-110px 0px -60% 0px', threshold: 0 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return activeId
}

/* ───────────────────────────────────────────────
   Reusable prose styles
   ─────────────────────────────────────────────── */
const prose = 'text-sm text-zinc-400 leading-relaxed'
const heading3 = 'text-base font-semibold text-zinc-200 mt-8 mb-3'
const heading4 = 'text-sm font-semibold text-zinc-300 mt-6 mb-2'
const sectionLabel = 'text-xs font-mono text-teal-400 tracking-widest uppercase'
const bulletList = 'space-y-2 ml-5 list-disc marker:text-zinc-700'
const sectionWrap = 'px-6 pb-20 scroll-mt-[110px]'
const container = 'max-w-[900px] mx-auto'
const capsBlock = 'text-xs text-zinc-500 leading-relaxed uppercase tracking-wide'

/* ───────────────────────────────────────────────
   Page Hero
   ─────────────────────────────────────────────── */
function PageHero() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-[800px] mx-auto text-center">
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
          style={{ textWrap: 'balance' }}
        >
          Terms of&nbsp;Service
        </h1>
        <p
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          Hyperscaled Challenge Terms of&nbsp;Service
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Effective Date: March&nbsp;26,&nbsp;2025
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Key Terms Summary + Legal Notices + Acceptance
   ─────────────────────────────────────────────── */
function KeyTermsSection() {
  return (
    <section id="key-terms" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>Key Terms Summary</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p className="text-xs text-zinc-600 italic">
            This summary is provided for convenience only and does not replace the full Agreement below. In the event of any conflict between this summary and the full Agreement, the full Agreement&nbsp;controls.
          </p>

          <h3 className={heading3}>What Hyperscaled Challenge Offers</h3>
          <p>
            Hyperscaled Challenge is an evaluation program that allows you to participate in simulated trading activities in tandem with your trading activities on Hyperliquid on a decentralized network called Subnet 8. On Hyperscaled, your trades on Hyperliquid are mirrored using simulated assets&mdash;not real money or cryptocurrency&mdash;so while you may independently trade through your own self-custodied account on Hyperliquid, and Vanta copies qualifying activity into the Challenge without putting any additional capital at risk. The Challenge evaluates your trading ability; it does not involve providing services for&nbsp;compensation.
          </p>

          <h3 className={heading3}>How It Works</h3>
          <ol className="space-y-3 ml-5 list-decimal marker:text-zinc-600">
            <li>
              <strong className="text-zinc-300">You Pay a Challenge Entry Fee:</strong> This fee (paid in USDC) is charged per Challenge purchase/attempt and gives you access to the Challenge and registers or activates the applicable Challenge Account on Subnet 8. The fee is only refundable before your registration is approved and your Challenge Account opened; after that the fee is non-refundable, except as required by Applicable Law or payment-network&nbsp;rules.
            </li>
            <li>
              <strong className="text-zinc-300">You Are a Participant, Not a Contractor or Employee:</strong> During the Challenge, you are a participant in an evaluation program. You do not provide services to Vanta and you do not receive any compensation, payouts, profit splits, or other economic&nbsp;benefits.
            </li>
            <li>
              <strong className="text-zinc-300">You Trade Through Your Own Account; Vanta Does Not Provide Capital:</strong> The Challenge itself uses simulated assets. To generate Challenge Trading Activities, you may independently trade through your own self-custodied account on a supported third-party venue (currently Hyperliquid mainnet) using your own capital. Vanta does not provide a company trading account, does not provide trading capital, and does not access your account for execution. Vanta monitors your Registered Wallet on a read-only basis and uses qualifying activity to create and evaluate simulated Challenge Trading&nbsp;Activities.
            </li>
            <li>
              <strong className="text-zinc-300">Your Performance Is Evaluated:</strong> Your qualifying trading activity from your Registered Wallet is mirrored, copied, or translated into simulated Challenge Trading Activities using Simulated Assets and measured against the criteria published in the Challenge Rules. If you meet the requirements and do not violate any rules, you may&nbsp;Pass.
            </li>
            <li>
              <strong className="text-zinc-300">Passing Does Not Guarantee an ICA Invitation:</strong> Passing the Challenge is a necessary but not sufficient condition for being invited to Vanta&rsquo;s Scaled Trader Program. Invitation is at Vanta&rsquo;s sole discretion and requires you to execute a separate Independent Contractor Agreement (&ldquo;ICA&rdquo;) and complete any required KYC/onboarding.
            </li>
            <li>
              <strong className="text-zinc-300">Multiple Registered Wallets Permitted; One Natural Person / One Seat per Asset Class:</strong> Each Hyperscaled Challenge Account must correspond to one natural person and one Registered Wallet. You may register multiple Registered Wallets and multiple Hyperscaled Challenge Accounts, but only one (1) Registered Wallet / Challenge Account per natural person per Asset Class may be recognized as eligible to proceed to an ICA. If you have multiple accounts you want Vanta to consider together, you must use the same email address for all such accounts; otherwise, Vanta may be unable to associate&nbsp;them.
            </li>
            <li>
              <strong className="text-zinc-300">No Compensation During the Challenge:</strong> There are no payouts, profit splits, bonuses, prizes, or any form of compensation during the Challenge. This is strictly an evaluation. Any gains or losses you may independently realize in your own third-party-venue account are separate from the Service and are not payments by&nbsp;Vanta.
            </li>
          </ol>

          <h3 className={heading3}>Important Points to Understand</h3>
          <ul className={bulletList}>
            <li>You are not an employee, independent contractor, or agent of Vanta during the&nbsp;Challenge</li>
            <li>No compensation or payouts of any kind during the Challenge&nbsp;stage</li>
            <li>The Challenge uses Simulated Assets and mirrored/simulated evaluation results, and any live third-party-venue trading you conduct is&nbsp;separate</li>
            <li>The Challenge Entry Fee is not a capital contribution or&nbsp;investment</li>
            <li>Passing is subject to validation; invitation to the Scaled Trader Program is discretionary and requires a separate&nbsp;ICA</li>
            <li>Disputes are resolved through binding arbitration, not&nbsp;courts</li>
            <li>Vanta operates the Platform but does not control the decentralized Network (Subnet 8), Hyperliquid, or any other supported third-party&nbsp;venue</li>
            <li>The Challenge Entry Fee is generally final and non-refundable once submitted/confirmed on-chain, except as required by Applicable&nbsp;Law</li>
            <li>Any descriptions of post-Challenge program economics (including simulated profit splits, scaling, payout timing, bonuses, or maximum account sizes) on Vanta&rsquo;s or Hyperscaled&rsquo;s website or marketing materials are informational only and are not part of this&nbsp;Agreement</li>
          </ul>

          <h3 className={heading3}>Important Legal Notices</h3>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5 space-y-3">
            <p className="text-xs text-amber-400/80 font-medium uppercase tracking-wider mb-3">Please read these notices carefully before using the Platform</p>
            <ul className={`${bulletList} marker:text-amber-500/40`}>
              <li><strong className="text-zinc-300">Binding Arbitration and Class Action Waiver (Section 20):</strong> Disputes are resolved through individual arbitration, not court litigation or class&nbsp;actions.</li>
              <li><strong className="text-zinc-300">Limitation of Liability (Section 16):</strong> Vanta&rsquo;s liability is capped and certain damages are&nbsp;excluded.</li>
              <li><strong className="text-zinc-300">Indemnification (Section 17):</strong> You agree to indemnify Vanta for certain&nbsp;claims.</li>
              <li><strong className="text-zinc-300">No Compensation During Challenge (Sections 8, 9):</strong> There are no payouts, prizes, profit splits, or compensation of any kind during the&nbsp;Challenge.</li>
              <li><strong className="text-zinc-300">No Guaranteed Program Invitation (Section 9):</strong> Passing the Challenge does not guarantee an invitation to the Scaled Trader&nbsp;Program.</li>
              <li><strong className="text-zinc-300">This Is Not an Investment (Sections 7, 22):</strong> You are paying for access to an evaluation product, not making an&nbsp;investment.</li>
            </ul>
          </div>

          <h3 className={heading3}>Acknowledgment and Acceptance</h3>
          <p className={capsBlock}>
            By clicking &ldquo;Confirm Payment in USDC and Begin Evaluation,&rdquo; connecting or registering an account or wallet, paying the Challenge Entry Fee, or using the Service, you acknowledge and agree&nbsp;that:
          </p>
          <ol className="space-y-2 ml-5 list-decimal marker:text-zinc-600 mt-3">
            <li>You have read, understood, and agree to be legally bound by this entire Agreement, including the arbitration agreement, class action waiver, jury trial waiver, limitations of liability, and indemnification&nbsp;obligations;</li>
            <li>You meet all eligibility requirements and are not located in a Prohibited&nbsp;Jurisdiction;</li>
            <li>During the Challenge, you are a participant in an evaluation program&mdash;not an employee, independent contractor, or agent of Vanta&mdash;and you are not entitled to employment benefits or any form of&nbsp;compensation;</li>
            <li>There are no payouts, profit splits, bonuses, prizes, or compensation of any kind during the&nbsp;Challenge;</li>
            <li>The Challenge uses mirrored/simulated evaluation results based on Simulated Assets, and those results are hypothetical and not indicative of real trading&nbsp;performance;</li>
            <li>You may independently trade through your own self-custodied third-party-venue account using your own capital, but Vanta does not provide capital, custody assets for you, or execute trades on your behalf, and the Service itself uses simulated assets&nbsp;only;</li>
            <li>This is not an investment and the Challenge Entry Fee is not a capital&nbsp;contribution;</li>
            <li>The Challenge Entry Fee is generally non-refundable once submitted/confirmed on-chain or once your Challenge Account is activated, except as required by Applicable&nbsp;Law;</li>
            <li>Passing the Challenge does not guarantee an invitation to the Scaled Trader Program; invitation is at Vanta&rsquo;s sole discretion and requires a separate ICA and completion of any required&nbsp;onboarding;</li>
            <li>Each Platform account, each Hyperscaled Challenge Account, and each Registered Wallet must correspond to one natural person, and you may register multiple Registered Wallets and multiple Hyperscaled Challenge Accounts; however, only one (1) Registered Wallet / Challenge Account per natural person per Asset Class may proceed to an ICA. If you have multiple accounts you want Vanta to consider together, you must use the same email address for all such accounts; otherwise, Vanta may be unable to associate&nbsp;them;</li>
            <li>You have reviewed and agree to the Challenge Rules and Offer Terms, each of which is incorporated into this Agreement by&nbsp;reference;</li>
            <li>Any descriptions of post-Challenge program terms appearing on Vanta&rsquo;s website, Hyperscaled&rsquo;s website, marketing materials, FAQs, dashboards, emails, or social media are informational only, are not part of this Agreement, and create no binding&nbsp;obligation;</li>
            <li>You have read and accept the risk disclosures in Section&nbsp;14;</li>
            <li>Disputes are resolved by binding arbitration, not courts, and you waive class action and jury trial&nbsp;rights;</li>
            <li>Vanta operates the Platform but does not control the Network, Hyperliquid, or any other supported third-party venue;&nbsp;and</li>
            <li>You have had the opportunity to seek independent legal, financial, and tax&nbsp;advice.</li>
            <li>For EU and UK persons: please see Section 23 for how to&nbsp;cancel.</li>
          </ol>
          <p className="mt-4 text-xs text-zinc-500 italic">
            For EU and UK persons: I expressly request Vanta to start providing the Challenge immediately, before the end of the 14-day withdrawal period. I acknowledge that this may cause me to lose my statutory right to withdraw once performance begins (for digital content), and that for services I lose the right to withdraw once the services are fully performed; if I withdraw after performance begins, I may be required to pay a proportionate amount for what has been&nbsp;provided.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 1 — Definitions
   ─────────────────────────────────────────────── */
function DefinitionsSection() {
  const defs = [
    ['"Affiliate"', 'means, with respect to any entity, any other entity that directly or indirectly controls, is controlled by, or is under common control with such entity.'],
    ['"Aggregate Exposure"', 'means the combined level of participation, positions, orders, notional, risk limits, simulated capital allocation, and/or other exposure measures (as determined by Vanta) across one or more accounts, including across Related Accounts.'],
    ['"Applicable Law"', 'means all applicable statutes, laws, regulations, ordinances, rules, judgments, orders, decrees, permits, and other requirements of any Governmental Authority.'],
    ['"Asset Class"', 'means a category of financial instruments or markets that may be traded or referenced through the Challenge, including through qualifying activity on a third-party venue supported by Vanta (currently Hyperliquid), as specified in the Challenge Rules.'],
    ['"Challenge"', 'means the paid evaluation program operated by Vanta through the Platform in which Participants engage in simulated Challenge Trading Activities using Simulated Assets for evaluation, with Vanta mirroring, copying, translating, or otherwise attributing qualifying trading activity through the Participants\u2019 own accounts on third-party venues (such as Hyperliquid) supported by Vanta into such simulated Challenge Trading Activities, subject to the performance criteria and rules set forth in the Challenge Rules.'],
    ['"Challenge Account"', 'means the account established for a Participant on the Platform and, if applicable, the Network for purposes of participating in the Challenge.'],
    ['"Challenge Data"', 'means all data, records, and outputs generated through or used in connection with the Service, including Registered Wallet data, observed trading activity on supported third-party venues, mirrored or translated Challenge Trading Activities, orders, positions, timestamps, logs, metrics, rankings, telemetry, and all other information generated by or in connection with the Challenge.'],
    ['"Challenge Entry Fee"', 'means the fee paid by Participants to Vanta in USDC for access to the Challenge and registration or activation on the Network and Service, as displayed at the time of purchase.'],
    ['"Challenge Rules"', 'means the rules, parameters, performance criteria, profit targets, drawdown limits, leverage limits, Tier specifications, Asset Class restrictions, registered-wallet restrictions, supported-venue requirements, mainnet/live-only requirements, restricted instruments or trading behaviors, inactivity definitions, integrity checks, and other requirements applicable to the Challenge, as published by Vanta at the URL designated on the Platform and incorporated herein by reference, as may be updated from time to time.'],
    ['"Challenge Trading Activities"', 'means the simulated trading activities recorded, generated, mirrored, copied, translated, or otherwise attributed by Vanta on the Network or through the Service based on qualifying trading activity executed by you from your Registered Wallet on a supported third-party venue, or otherwise as part of the Challenge using Simulated Assets.'],
    ['"Confidential Information"', 'means any non-public information disclosed by Vanta, including business strategies, algorithms, technical specifications, participant data, and any information designated as confidential.'],
    ['"Derived Data"', 'means aggregated, anonymized, or otherwise derived analyses, insights, datasets, or learnings generated from Challenge Data.'],
    ['"Fail"', 'means a determination by Vanta that a Participant has not met the Challenge criteria or has violated the Challenge Rules or this Agreement, resulting in termination of the applicable Challenge attempt.'],
    ['"Governmental Authority"', 'means any federal, state, local, or foreign government, or political subdivision thereof, or any governmental, regulatory, or administrative authority, agency, or court.'],
    ['"High-Water Mark"', 'means, with respect to a Challenge Account, the highest net asset value (or equivalent metric) achieved by such account at any point during the Challenge, as calculated by Vanta in accordance with the Challenge Rules.'],
    ['"ICA" or "Independent Contractor Agreement"', 'means the separate agreement between Vanta and a participant in the Scaled Trader Program governing the post-Challenge independent contractor relationship, which is not part of or governed by this Agreement.'],
    ['"Indemnified Parties"', 'means Vanta, its Affiliates, and their respective directors, officers, employees, agents, advisors, consultants, licensors, service providers, contractors, successors, and assigns.'],
    ['"Intellectual Property Rights"', 'means all intellectual property rights worldwide, including patents, copyrights, trademarks, service marks, trade names, trade dress, trade secrets, know-how, moral rights, rights of publicity, and all other proprietary rights.'],
    ['"KYC"', 'means "Know Your Customer" verification procedures, including identity verification, anti-money laundering screening, and sanctions screening.'],
    ['"Losses"', 'means any and all claims, demands, actions, causes of action, liabilities, damages, losses, costs, expenses, fines, penalties, judgments, settlements, and fees (including reasonable attorneys\u2019 fees and costs of investigation, litigation, and appeal).'],
    ['"Market Data"', 'means any price, quote, order book, index, benchmark, reference rate, timestamp, or other market or pricing information displayed, used, or relied upon by the Platform, the Network, any supported third-party venue, Validators, or any third-party provider in connection with the Service.'],
    ['"Max Drawdown"', 'means the maximum permitted decline in a Challenge Account\u2019s net asset value (or equivalent metric) from its High-Water Mark, as specified in the Challenge Rules.'],
    ['"Network" or "Subnet 8"', 'means the decentralized Vanta Network operated by independent Validators, on which Challenge Accounts may be registered and Challenge Trading Activities may be recorded or evaluated. The Network is separate from and not controlled by Vanta.'],
    ['"Network Emissions"', 'means any digital tokens, cryptocurrency, or other digital assets emitted, distributed, or allocated by the Network in connection with Challenge Trading Activities or other simulated trading activities conducted or recorded on the Network through the Service.'],
    ['"Scaled Trader Program"', 'means Vanta\u2019s separate post-Challenge program governed entirely by a separate Independent Contractor Agreement and not by this Agreement.'],
    ['"Simulated Assets"', 'means the simulated, non-real assets or notional positions used within Challenge Trading Activities on the Network or Service, which have no real-world monetary value and exist solely for evaluation purposes.'],
    ['"Platform" or "Hyperscaled Platform"', 'means the user interface, application, website, portal, dashboards, APIs, browser extensions, and related systems operated by Vanta that enable Participants to register, link a Registered Wallet, be registered on the Network, and participate in the Challenge.'],
    ['"Registered Wallet"', 'means the public wallet address or other designated identifier you link to your account for purposes of the Service, from which Vanta monitors qualifying third-party-venue activity on a read-only basis.'],
    ['"Pass"', 'means a determination by Vanta that a Participant has met all applicable Challenge criteria as set forth in the Challenge Rules without any disqualifying violations, subject to verification and validation by Vanta.'],
    ['"Validators"', 'means the independent operators that maintain and validate transactions on the Network.'],
  ]

  return (
    <section id="definitions" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>1. Definitions</span>
        <p className={`mt-4 ${prose}`}>
          For purposes of this Agreement, the following terms shall have the meanings set forth&nbsp;below:
        </p>
        <dl className="mt-4 space-y-3">
          {defs.map(([term, def]) => (
            <div key={term} className="text-sm">
              <dt className="text-zinc-300 font-medium inline">{term} </dt>
              <dd className="text-zinc-400 inline">{def}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 2 — Service Description
   ─────────────────────────────────────────────── */
function ServiceDescriptionSection() {
  return (
    <section id="service-description" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>2. Service Description</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>2.1 Overview</h4>
          <p>Hyperscaled Challenge provides an evaluation platform that enables you to link a Registered Wallet and have qualifying trading activity from a supported third-party venue (currently Hyperliquid mainnet) mirrored, copied, or translated into simulated Challenge Trading Activities on Subnet 8, a decentralized network. The Challenge is an evaluation program designed to assess your trading ability using Simulated Assets. You pay a Challenge Entry Fee for access, and your mirrored/simulated performance is measured against the criteria published in the Challenge Rules. Vanta does not provide trading capital or a company trading account, does not execute your third-party-venue trades, and does not pay compensation during the&nbsp;Challenge.</p>

          <h4 className={heading4}>2.2 What Vanta Provides</h4>
          <p>Through the Platform, Vanta:</p>
          <ul className={bulletList}>
            <li>Provides the user interface for registration, wallet linking, and participation in the&nbsp;Challenge</li>
            <li>Receives Challenge Entry Fees in USDC through the on-chain payment method specified on the&nbsp;Platform</li>
            <li>Facilitates your registration on the Network and activation of your Challenge&nbsp;Account</li>
            <li>Reads and monitors public qualifying trading activity from your Registered Wallet on a supported third-party venue on a read-only basis and mirrors, copies, or translates qualifying activity into Challenge Trading Activities. Vanta does not request or require your private key, seed phrase, withdrawal credentials, or discretionary trading authority as a condition of using the&nbsp;Service</li>
            <li>Evaluates your Challenge Trading Activities against the criteria set forth in the Challenge&nbsp;Rules</li>
            <li>Determines Pass/Fail outcomes, and validates&nbsp;results</li>
            <li>Provides support and maintains the&nbsp;Platform</li>
          </ul>

          <h4 className={heading4}>2.3 The Platform vs. The Network vs. Third-Party Venues</h4>
          <p>The Platform (Hyperscaled) is a centralized service operated by Vanta. The Network (Subnet 8) is a separate, decentralized system operated by independent Validators over which Vanta has no control, ownership, or operational authority. Qualifying live trading activity may occur on one or more supported third-party venues (currently Hyperliquid mainnet), each of which is separate from and not controlled by&nbsp;Vanta.</p>

          <h4 className={heading4}>2.4 No Fiduciary Relationship</h4>
          <p>This Agreement does not create a fiduciary relationship. Vanta does not owe fiduciary duties to Participants beyond the obligations expressly stated in this&nbsp;Agreement.</p>

          <h4 className={heading4}>2.5 Challenge Program Structure</h4>
          <p><strong className="text-zinc-300">Stage 1 &mdash; Challenge:</strong> You pay a Challenge Entry Fee and participate in an evaluation program using Simulated Assets. There is no compensation, payouts, profit splits, or economic benefit of any kind during Stage&nbsp;1.</p>
          <p><strong className="text-zinc-300">Stage 2 &mdash; Scaled Trader Program (Separate Agreement):</strong> Participants who Pass the Challenge may, at Vanta&rsquo;s sole discretion, be invited to join the Scaled Trader Program. The Scaled Trader Program is governed entirely by a separate ICA and is not part of this&nbsp;Agreement.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 3 — Eligibility and Registration
   ─────────────────────────────────────────────── */
function EligibilitySection() {
  return (
    <section id="eligibility" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>3. Eligibility and Registration</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>3.1 Eligibility Requirements</h4>
          <p>To use the Service, you represent and warrant that&nbsp;you:</p>
          <ul className={bulletList}>
            <li>Are at least eighteen (18) years of age or the age of legal majority in your jurisdiction, whichever is&nbsp;greater</li>
            <li>Have the legal capacity to enter into this&nbsp;Agreement</li>
            <li>Are not located in, a citizen of, or resident of any Prohibited&nbsp;Jurisdiction</li>
            <li>Are not identified on any Sanctions&nbsp;List</li>
            <li>Are not acting on behalf of any person or entity on a Sanctions List or located in a Prohibited&nbsp;Jurisdiction</li>
            <li>Are not prohibited from using the Service under Applicable&nbsp;Law</li>
            <li>Have not previously been suspended or terminated from the&nbsp;Service</li>
            <li>Will provide accurate and complete information during registration and maintain its&nbsp;accuracy</li>
          </ul>

          <h4 className={heading4}>3.2 KYC Verification</h4>
          <p>Vanta may require identity verification or other compliance checks at any time for compliance, anti-fraud, or account-limit purposes. You agree to provide accurate information, cooperate with verification requests, and update information as&nbsp;needed.</p>

          <h4 className={heading4}>3.3 Account Security</h4>
          <p>You are solely responsible for maintaining the confidentiality and security of your account credentials, including passwords and two-factor authentication, and for maintaining exclusive control of your Registered Wallet and any associated private keys, seed phrases, or wallet-authorization devices. Vanta will never require your private keys or seed phrase to provide the&nbsp;Service.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 5 — Fees and Payment Processing
   ─────────────────────────────────────────────── */
function FeesSection() {
  return (
    <section id="fees" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>5. Fees and Payment Processing</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>5.1 Challenge Entry Fee</h4>
          <p>To access the Challenge and be registered or activated on the Network, you must pay the Challenge Entry Fee displayed at the time of purchase. Different Tiers and Asset Classes may be offered at different price points as shown in the Offer&nbsp;Terms.</p>

          <h4 className={heading4}>5.2 USDC Payments; On-Chain Transfer Mechanics</h4>
          <p>Challenge Entry Fees are paid in USDC using the on-chain payment method, wallet address, smart contract, chain/network, or other instructions specified by Vanta on the Platform. You are solely responsible for sending the correct token, on the correct chain/network, in the correct amount, to the correct destination, and with sufficient network&nbsp;fees/gas.</p>

          <h4 className={heading4}>5.3 No General Cancellation Right; Finality of On-Chain Payments</h4>
          <p>Except as required by Applicable Law, once you submit or authorize an on-chain payment for a Challenge Entry Fee, the purchase is final and cannot be canceled, reversed, or&nbsp;rescaled.</p>

          <h4 className={heading4}>5.4 EU/UK Consumer Withdrawal Rights</h4>
          <p>If you are a consumer located in the United Kingdom or European Union, you may have a statutory right to withdraw from this Agreement within fourteen (14) days of purchase under applicable consumer protection&nbsp;laws.</p>

          <h4 className={heading4}>5.5 Non-Refundable After Confirmation/Activation</h4>
          <p>After the applicable on-chain payment has sufficient confirmations and/or your Challenge Account has been registered or activated, the Challenge Entry Fee is final and non-refundable under any circumstances (except as required by Applicable&nbsp;Law).</p>

          <h4 className={heading4}>5.6 Payment Disputes; Reversals; Fraudulent Claims</h4>
          <p>If you initiate or assist any payment dispute, reversal request, clawback, fraud claim, or similar recovery attempt with respect to a Challenge Entry Fee after confirmation/activation, Vanta may immediately suspend or terminate your&nbsp;account.</p>

          <h4 className={heading4}>5.7 Taxes on Fees</h4>
          <p>The Challenge Entry Fee does not include any applicable taxes. You are responsible for all taxes, duties, and governmental charges imposed on the Challenge Entry Fee by any&nbsp;jurisdiction.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 6 — Relationship of the Parties
   ─────────────────────────────────────────────── */
function RelationshipSection() {
  return (
    <section id="relationship" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>6. Relationship of the Parties</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>6.1 Participant Status</h4>
          <p>During the Challenge, you are a participant in an evaluation program. You are not an employee, independent contractor, partner, joint venturer, member, shareholder, or agent of Vanta. You do not provide services to Vanta during the&nbsp;Challenge.</p>

          <h4 className={heading4}>6.2 No Compensation or Benefits</h4>
          <p>As a Challenge Participant, you are not entitled to any compensation, wages, salary, bonuses, profit splits, prizes, payouts, commissions, or any other form of economic benefit from Vanta during the&nbsp;Challenge.</p>

          <h4 className={heading4}>6.3 No Authority to Bind</h4>
          <p>You have no authority to bind Vanta to any contract, obligation, or liability, or to make any representation or warranty on behalf of&nbsp;Vanta.</p>

          <h4 className={heading4}>6.4 Your Independence</h4>
          <p>As a Challenge Participant, you have sole control over when, where, and how you trade through your own third-party-venue account and participate in the Service. Vanta does not provide training, supervision, or direction on trading strategies or&nbsp;methods.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 7 — Your Own Capital
   ─────────────────────────────────────────────── */
function CapitalSection() {
  return (
    <section id="capital" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>7. Your Own Capital; No Capital Provided by Vanta</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>7.1 Your Own Capital</h4>
          <p>The Challenge Account and any Scaled Trader Program account tracked by Vanta use Simulated Assets and simulated metrics that have no real-world monetary value and cannot be redeemed, withdrawn, transferred, or exchanged for any currency, cryptocurrency, or other asset. Vanta does not provide a company trading account, does not lend or allocate capital to you, does not custody assets for you, and does not execute or route trades on your&nbsp;behalf.</p>

          <h4 className={heading4}>7.2 Not an Investment</h4>
          <p>Your participation in the Challenge or the Scaled Trader Program is not an investment of any kind. The Challenge Entry Fee is payment for access to an evaluation product, not a capital contribution, security, deposit, escrow, stored-value balance, or&nbsp;investment.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 8 — Network Emissions
   ─────────────────────────────────────────────── */
function NetworkEmissionsSection() {
  return (
    <section id="network-emissions" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>8. Network Emissions; No Rights to Digital Assets</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>8.1 Ownership of Network Emissions</h4>
          <p>When Challenge Trading Activities or mirrored Scaled Trader Program activities are recorded or conducted on the Network, the Network may emit digital assets (Network Emissions). Such Network Emissions are the sole and exclusive property of Vanta. Participants do not receive, own, or have any right, title, interest, or claim to Network&nbsp;Emissions.</p>

          <h4 className={heading4}>8.2 No Claims to Network Emissions</h4>
          <p>You acknowledge and irrevocably agree that you have no ownership interest, beneficial interest, equitable interest, claim, demand, or right of any kind in or to any Network Emissions. You waive any claim based on unjust enrichment, quantum meruit, constructive trust, resulting trust, joint venture, partnership, employment, contribution, conversion, or any other legal or equitable&nbsp;theory.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 9 — Challenge Evaluation
   ─────────────────────────────────────────────── */
function EvaluationSection() {
  return (
    <section id="evaluation" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>9. Challenge Evaluation; Pass/Fail; No Compensation</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>9.1 Evaluation Criteria</h4>
          <p>Your Challenge Trading Activities will be evaluated against the performance criteria, rules, and requirements set forth in the Challenge Rules, including profit targets, Max Drawdown limits, leverage limits, Tier parameters, and Asset Class&nbsp;restrictions.</p>

          <h4 className={heading4}>9.2 Pass/Fail Determination</h4>
          <p>A Pass requires meeting all applicable criteria set forth in the Challenge Rules without any disqualifying violations of this Agreement or the Challenge&nbsp;Rules.</p>

          <h4 className={heading4}>9.3 No Compensation During Challenge</h4>
          <p className={capsBlock}>There are no payouts, profit splits, bonuses, prizes, compensation, or any other form of economic benefit from Vanta during the Challenge. The Challenge is solely an evaluation. Your sole potential benefit from passing the Challenge is the possibility (but not guarantee) of being invited to the Scaled Trader Program under a separate&nbsp;ICA.</p>

          <h4 className={heading4}>9.4 Invitation to Scaled Trader Program Is Discretionary</h4>
          <p>Passing the Challenge is a necessary but not sufficient condition for an invitation to the Scaled Trader Program. Vanta retains sole and absolute discretion to determine whether to extend an&nbsp;invitation.</p>

          <h4 className={heading4}>9.5 Results Validation</h4>
          <p>Vanta may, in its sole discretion, review Registered Wallet activity, third-party-venue activity, Challenge Trading Activities, and related metrics, and may adjust, exclude, disregard, re-rank, disqualify, or invalidate any results where Vanta determines that they are Non-Replicable, materially influenced by Technical Artifacts, or inconsistent with the intended purpose of the&nbsp;Challenge.</p>

          <h4 className={heading4}>9.7 Multiple Attempts; Limited Recognition</h4>
          <p>A Participant may purchase and participate in multiple Challenge attempts. However, Vanta may recognize at most one (1) Registered Wallet / Challenge Account per natural person per Asset Class for purposes of eligibility to proceed to an&nbsp;ICA.</p>

          <h4 className={heading4}>9.8 Scaled Trader Program Descriptions; Informational Only</h4>
          <p>Any descriptions of the Scaled Trader Program, including descriptions of scaling mechanics, simulated account sizes, payout frequencies, or other post-Challenge program terms, are provided for informational and illustrative purposes only and are not binding on Vanta and do not form part of this&nbsp;Agreement.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 10 — Participant Conduct
   ─────────────────────────────────────────────── */
function ConductSection() {
  return (
    <section id="conduct" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>10. Participant Conduct and Prohibited Activities</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>10.1 General Conduct Standards</h4>
          <p>You agree to use the Service only for lawful purposes and in compliance with all Applicable Laws; provide accurate, complete, and truthful information; maintain the security of your account; comply with all Challenge Rules; and use the Service in good&nbsp;faith.</p>

          <h4 className={heading4}>10.2 Prohibited Activities</h4>
          <p>Neither you nor any third party acting on your behalf&nbsp;may:</p>
          <ul className={bulletList}>
            <li><strong className="text-zinc-300">Automated Systems and Manipulation:</strong> Use automated tools to access the Platform in ways prohibited by this Agreement; engage in market manipulation (wash trading, spoofing, layering, front-running, pump-and-dump); exploit bugs, glitches, or&nbsp;vulnerabilities</li>
            <li><strong className="text-zinc-300">Account, Wallet, and Identity Violations:</strong> Use false identities, impersonate others, or register for someone else; register multiple wallets/accounts to evade rules; share, sell, lease, or transfer account&nbsp;access</li>
            <li><strong className="text-zinc-300">Security Violations:</strong> Circumvent security features, access controls, or authentication; probe for vulnerabilities; introduce malicious&nbsp;code</li>
            <li><strong className="text-zinc-300">Intellectual Property Violations:</strong> Reverse engineering, copying, modifying, scraping, or removing proprietary&nbsp;notices</li>
            <li><strong className="text-zinc-300">Legal and Regulatory Violations:</strong> Violate applicable laws, sanctions, or use the Service for money laundering, terrorist financing, or other financial&nbsp;crimes</li>
            <li><strong className="text-zinc-300">MNPI or Insider Conduct:</strong> Use Material Nonpublic Information in connection with Challenge Trading&nbsp;Activities</li>
          </ul>

          <h4 className={heading4}>10.3 Account Limits and Anti-Circumvention</h4>
          <p>Each Platform account and each Challenge Account must correspond to a single natural person. You may create multiple Challenge Accounts, but Vanta may recognize at most one (1) per natural person per Asset Class for ICA&nbsp;eligibility.</p>

          <h4 className={heading4}>10.6 Consequences of Violations</h4>
          <p>Violations may result in immediate suspension or permanent termination, Fail determination, disqualification from current and future Challenges, revocation of previously issued Passes, civil liability, referral to law enforcement, and injunctive&nbsp;relief.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 11 — Intellectual Property
   ─────────────────────────────────────────────── */
function IPSection() {
  return (
    <section id="ip" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>11. Intellectual Property</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>11.1 Vanta&rsquo;s Intellectual Property</h4>
          <p>The Platform and all Platform Content are owned by Vanta or its licensors and are protected by copyright, trademark, patent, trade secret, and other Intellectual Property&nbsp;Rights.</p>

          <h4 className={heading4}>11.2 Limited License to Participants</h4>
          <p>Subject to your compliance with this Agreement, Vanta grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Platform solely for the purposes expressly permitted by this&nbsp;Agreement.</p>

          <h4 className={heading4}>11.3 Permitted Social Sharing</h4>
          <p>You may publicly share limited excerpts of Platform Content solely to show your own performance metrics, rankings, or results, subject to accuracy, required disclosures, and compliance requirements detailed in the full&nbsp;Agreement.</p>

          <h4 className={heading4}>11.4 Ownership of Challenge Data</h4>
          <p>You retain all right, title, and interest in User IP. All Challenge Data and Derived Data are the sole and exclusive property of&nbsp;Vanta.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 12 — Confidentiality
   ─────────────────────────────────────────────── */
function ConfidentialitySection() {
  return (
    <section id="confidentiality" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>12. Confidentiality</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p>You agree to maintain the strict confidentiality of all Confidential Information and to use Confidential Information solely for the purpose of using the Service as permitted by this Agreement. You shall not disclose Confidential Information to any third party without Vanta&rsquo;s prior written&nbsp;consent.</p>
          <p>Confidential Information does not include information that was publicly available prior to disclosure, becomes publicly available through no fault of yours, was rightfully in your possession prior to disclosure, is independently developed by you, or is rightfully obtained from a third party without confidentiality&nbsp;restrictions.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 13 — Data Protection and Privacy
   ─────────────────────────────────────────────── */
function DataProtectionSection() {
  return (
    <section id="data-protection" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>13. Data Protection and Privacy</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p>Vanta collects and processes personal data in accordance with its Privacy Policy, which is incorporated herein by reference and available on the Platform. By using the Service, you consent to the collection, processing, storage, and transfer of your personal data as described in this Agreement and the Privacy&nbsp;Policy.</p>
          <p>Your personal data may be transferred to and processed in countries other than your country of residence. Vanta implements reasonable administrative, technical, and physical security measures to protect personal data in its&nbsp;possession.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 14 — Risk Disclosures
   ─────────────────────────────────────────────── */
function RiskSection() {
  return (
    <section id="risk" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>14. Risk Disclosures</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p className="text-xs text-amber-400/80 font-medium uppercase tracking-wider">Please read these risk disclosures carefully. By using the Service, you acknowledge and accept all risks described&nbsp;herein.</p>

          <h4 className={heading4}>14.1 Simulated / Mirrored Performance Limitations</h4>
          <p className={capsBlock}>Hypothetical, mirrored, and simulated performance results have inherent limitations. The Challenge results recorded, mirrored, copied, translated, or otherwise attributed by Vanta using Simulated Assets are evaluation results and may differ from your live results. Results from Challenge Trading Activities are not indicative of future performance in any real trading&nbsp;context.</p>

          <h4 className={heading4}>14.2 Digital Asset and Self-Custody Risks</h4>
          <p>Digital assets may be highly volatile and speculative. The regulatory status of digital assets is unclear and evolving. USDC or any other stable asset may de-peg, be frozen, or become unavailable. If you lose access to your Registered Wallet, private keys, or seed phrase, you may suffer unrecoverable&nbsp;loss.</p>

          <h4 className={heading4}>14.3 Blockchain and Technology Risks</h4>
          <p>Smart contracts may contain bugs or vulnerabilities. The Network, Hyperliquid, or any other supported third-party venue may experience failures, attacks, forks, congestion, or downtime. The Platform and related systems may be subject to hacking, cyberattacks, or data&nbsp;breaches.</p>

          <h4 className={heading4}>14.4 Operational and Business Risks</h4>
          <p>The Platform may be unavailable or experience interruptions. The Service depends on third parties that may fail or change services. You may not Pass the Challenge and you may not receive an invitation to the Scaled Trader&nbsp;Program.</p>

          <h4 className={heading4}>14.6 Assumption of Risk</h4>
          <p className={capsBlock}>By using the Service, you acknowledge that you understand and voluntarily assume all risks described in this Section 14. You agree that Vanta shall not be liable for any Losses arising from these&nbsp;risks.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 15 — Disclaimers
   ─────────────────────────────────────────────── */
function DisclaimersSection() {
  return (
    <section id="disclaimers" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>15. Disclaimers</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p className={capsBlock}>The Service is provided &ldquo;as is,&rdquo; &ldquo;as available,&rdquo; and &ldquo;with all faults&rdquo; without warranties of any kind, whether express, implied, statutory, or otherwise. To the fullest extent permitted by Applicable Law, Vanta and its Affiliates, licensors, and service providers disclaim all warranties, including implied warranties of merchantability, fitness for a particular purpose, title, non-infringement, accuracy, reliability, availability, security, and warranties arising from course of dealing, course of performance, or trade&nbsp;usage.</p>

          <p className={capsBlock}>Vanta does not warrant that the Service will meet your requirements, be uninterrupted, timely, secure, or error-free, or that you will Pass the Challenge or receive an invitation to the Scaled Trader&nbsp;Program.</p>

          <p>Nothing in the Service constitutes financial, investment, tax, legal, or other professional advice. The Service is for simulated trading and evaluation purposes only. You should consult qualified professionals for such&nbsp;advice.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 16 — Limitation of Liability
   ─────────────────────────────────────────────── */
function LiabilitySection() {
  return (
    <section id="liability" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>16. Limitation of Liability</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>16.1 Exclusion of Certain Damages</h4>
          <p className={capsBlock}>To the maximum extent permitted by Applicable Law, in no event shall Vanta or any Indemnified Party be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages; loss of profits, revenue, income, business, savings, or anticipated benefits; loss of goodwill or reputation; loss of data; cost of procurement of substitute services; or business interruption, arising from or related to this Agreement or the Service, regardless of the theory of&nbsp;liability.</p>

          <h4 className={heading4}>16.2 Aggregate Liability Cap</h4>
          <p className={capsBlock}>Vanta&rsquo;s total cumulative liability for all claims of any kind arising from or related to this Agreement or the Service shall not exceed the greater of: (a) the total Challenge Entry Fees actually paid by you to Vanta in the twelve (12) months immediately preceding the first event giving rise to liability; or (b) one hundred United States dollars (USD&nbsp;$100.00).</p>

          <h4 className={heading4}>16.7 Time Limitation on Claims</h4>
          <p>Any claim or cause of action arising from or related to this Agreement or the Service must be filed within one (1) year after the claim or cause of action arose, or it shall be permanently&nbsp;barred.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 17 — Indemnification
   ─────────────────────────────────────────────── */
function IndemnificationSection() {
  return (
    <section id="indemnification" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>17. Indemnification</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p>You agree to indemnify, defend, and hold harmless the Indemnified Parties from and against any and all Losses arising from or related to: your access to or use of the Service; your breach of this Agreement; your violation of Applicable Law, Sanctions, or third-party rights; your negligence, willful misconduct, fraud, or bad faith; any User Content you submit; any dispute between you and any third party; your tax obligations; any claim that your activities violate securities, commodities, banking, money transmission, or other financial regulations; any regulatory investigation related to your activities; any claim arising from false, misleading, or incomplete information you provided; any claim arising from your infringement of Intellectual Property Rights; any chargeback, payment dispute, or reversal initiated by you; and any other matter for which you are responsible under this&nbsp;Agreement.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 18 — Term and Termination
   ─────────────────────────────────────────────── */
function TerminationSection() {
  return (
    <section id="termination" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>18. Term and Termination</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>18.1 Term</h4>
          <p>This Agreement begins when you accept it and continues until terminated by either party in accordance with this&nbsp;Section.</p>

          <h4 className={heading4}>18.2 Termination by You</h4>
          <p>You may terminate this Agreement at any time by discontinuing use of the Service and notifying Vanta. Termination does not entitle you to any refund of Challenge Entry&nbsp;Fees.</p>

          <h4 className={heading4}>18.3 Termination by Vanta</h4>
          <p>Vanta may suspend or terminate your access to the Service, immediately and without prior notice, for any reason, including your breach of this Agreement, failure to complete identity verification, suspected fraud or manipulation, law enforcement requests, compliance requirements, modification or discontinuation of the Service, inactivity, technical or security reasons, or Vanta&rsquo;s sole business&nbsp;judgment.</p>

          <h4 className={heading4}>18.4 Effect of Termination</h4>
          <p>Upon termination, your right to access and use the Service ceases immediately, your license to the Platform is revoked, and any pending Challenge attempt may be terminated. Re-entry into any Challenge requires a new Challenge Entry&nbsp;Fee.</p>

          <h4 className={heading4}>18.6 Inactivity Termination</h4>
          <p>If your Challenge Account shows no qualifying trading activity for twelve (12) consecutive months, Vanta may close your account and terminate your Challenge without further&nbsp;notice.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 19 — Modifications
   ─────────────────────────────────────────────── */
function ModificationsSection() {
  return (
    <section id="modifications" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>19. Modifications</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>19.1 Changes to Agreement</h4>
          <p>Vanta may modify this Agreement at any time in its sole discretion. Changes may take effect immediately upon posting, and your continued use of the Service after the effective time constitutes acceptance of the modified&nbsp;Agreement.</p>

          <h4 className={heading4}>19.2 Changes to Service</h4>
          <p>Vanta reserves the right to modify, update, suspend, or discontinue the Service, in whole or in part, at any time and for any reason, with or without&nbsp;notice.</p>

          <h4 className={heading4}>19.3 Updates to Challenge Rules and Offer Terms</h4>
          <p>The version of the Challenge Rules and Offer Terms in effect at the time a Participant purchases and enters a Challenge shall govern that Participant&rsquo;s Challenge attempt, except for changes necessary to address fraud, abuse, or circumvention; required by Applicable Law; technical corrections or clarifications; or otherwise non-material in&nbsp;nature.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 20 — Dispute Resolution
   ─────────────────────────────────────────────── */
function DisputeSection() {
  return (
    <section id="disputes" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>20. Dispute Resolution</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p className="text-xs text-amber-400/80 font-medium uppercase tracking-wider">Please read this section carefully. It affects your legal rights, including your right to file a lawsuit in court and to have a jury&nbsp;trial.</p>

          <h4 className={heading4}>20.1 Informal Resolution</h4>
          <p>Before initiating any formal dispute resolution proceeding, you agree to first contact Vanta and attempt to resolve any dispute informally. The parties shall negotiate in good faith for at least sixty (60)&nbsp;days.</p>

          <h4 className={heading4}>20.2 Binding Arbitration</h4>
          <p className={capsBlock}>Any dispute, claim, or controversy arising from or relating to this Agreement, the Service, or the breach, termination, enforcement, interpretation, or validity hereof shall be finally and exclusively resolved by binding arbitration, administered by the International Centre for Dispute Resolution (&ldquo;ICDR&rdquo;). The place of arbitration shall be George Town, Grand Cayman, Cayman&nbsp;Islands.</p>

          <h4 className={heading4}>20.5 Class Action Waiver</h4>
          <p className={capsBlock}>You and Vanta agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, collective, representative, or private attorney general&nbsp;action.</p>

          <h4 className={heading4}>20.6 Jury Trial Waiver</h4>
          <p className={capsBlock}>To the fullest extent permitted by Applicable Law, you and Vanta each knowingly and voluntarily waive any constitutional and statutory right to sue in court and to a trial by&nbsp;jury.</p>

          <h4 className={heading4}>20.8 Time Limitation</h4>
          <p>Any claim must be filed within one (1) year after it arose or it is permanently&nbsp;barred.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 21 — Governing Law
   ─────────────────────────────────────────────── */
function GoverningLawSection() {
  return (
    <section id="governing-law" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>21. Governing Law and Jurisdiction</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p>This Agreement and any dispute arising from or relating to it shall be governed by and construed in accordance with the laws of the Cayman Islands, without regard to conflict of law principles. Subject to Section 20 (Dispute Resolution), any legal action or proceeding not subject to arbitration shall be brought exclusively in the courts of the Cayman Islands, and you irrevocably consent to the personal jurisdiction and venue of such courts and waive any objection based on inconvenient forum or lack of&nbsp;jurisdiction.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 22 — Regulatory Disclosures
   ─────────────────────────────────────────────── */
function RegulatorySection() {
  return (
    <section id="regulatory" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>22. Regulatory Disclosures and Compliance</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>22.1 Not a Securities Offering</h4>
          <p>This Agreement and the Service do not constitute an offer or sale of securities, investment contracts, or any other regulated financial instruments in any jurisdiction. The Challenge Entry Fee is payment for access to an evaluation product. No compensation, payout, or return of any kind is provided during the&nbsp;Challenge.</p>

          <h4 className={heading4}>22.3 Not Investment or Trading Advice</h4>
          <p>Vanta is not a registered investment adviser, broker-dealer, commodity trading advisor, futures commission merchant, or any other type of regulated financial services provider. Nothing in the Service is investment advice, trading advice, or a recommendation to buy, sell, hold, or trade any security, commodity, or digital&nbsp;asset.</p>

          <h4 className={heading4}>22.4 Simulated Trading Only</h4>
          <p>All Challenge Trading Activities used by the Service are simulated, mirrored, translated, or notional evaluation activities using Simulated Assets. Vanta does not buy, sell, route, or execute real securities, commodities, currencies, cryptocurrencies, or other financial instruments for you through the&nbsp;Service.</p>

          <h4 className={heading4}>22.5 CFTC and Commodities Disclaimer</h4>
          <p className={capsBlock}>The Service&rsquo;s evaluation results are simulated, mirrored, or hypothetical and are not subject to the same regulatory requirements as actual trading in commodity interests, futures, options, or swaps. No representation is being made that any account will or is likely to achieve profits or losses similar to those&nbsp;shown.</p>

          <h4 className={heading4}>22.7 Anti-Money Laundering</h4>
          <p>Vanta maintains an anti-money laundering (AML) compliance program. You agree to cooperate with all AML compliance&nbsp;requirements.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 23 — EU/UK Consumer Rights
   ─────────────────────────────────────────────── */
function EUUKSection() {
  return (
    <section id="eu-uk" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>23. EU/UK Consumer Withdrawal and Cancellation Rights</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p className="text-xs text-zinc-500 italic">This Section applies only if you are a consumer located in the European Union or the United&nbsp;Kingdom.</p>

          <h4 className={heading4}>23.2 14-Day Right to Withdraw</h4>
          <p>You have a statutory right to withdraw from this Agreement within fourteen (14) days from the date you purchase a Challenge (the &ldquo;Withdrawal Period&rdquo;), without giving any reason, unless an exception applies under Section&nbsp;23.5.</p>

          <h4 className={heading4}>23.3 How to Withdraw</h4>
          <p>To exercise your right to withdraw, you must notify Vanta of your decision by an unequivocal statement (for example, by email). Send your withdrawal notice to: <a href="mailto:support@vantatrading.io" className="text-teal-400 hover:text-teal-300 transition-colors">support@vantatrading.io</a></p>

          <h4 className={heading4}>23.4 Refund Timing</h4>
          <p>If you validly withdraw, Vanta will reimburse you in USDC without undue delay and in any event no later than fourteen (14) days after receiving your withdrawal&nbsp;notice.</p>

          <h4 className={heading4}>23.5 Immediate Access; Effects on Withdrawal</h4>
          <p>If you request immediate access at checkout, you expressly request Vanta to begin performance during the Withdrawal Period. Once your Challenge Account is opened/activated, you may lose your statutory right to withdraw, to the extent permitted by&nbsp;law.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 24 — General Provisions
   ─────────────────────────────────────────────── */
function GeneralSection() {
  return (
    <section id="general" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>24. General Provisions</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <h4 className={heading4}>24.1 Entire Agreement</h4>
          <p>This Agreement, together with the Privacy Policy, the Challenge Rules, the Offer Terms, and any other documents incorporated by reference, constitutes the entire agreement between you and Vanta regarding the&nbsp;Service.</p>

          <h4 className={heading4}>24.2 Severability</h4>
          <p>If any provision is held invalid or unenforceable, it shall be modified to the minimum extent necessary or severed, and the remaining provisions shall continue in full&nbsp;force.</p>

          <h4 className={heading4}>24.3 Waiver</h4>
          <p>Vanta&rsquo;s failure to enforce any provision is not a waiver. Waivers must be in writing and signed by an authorized&nbsp;representative.</p>

          <h4 className={heading4}>24.4 Assignment</h4>
          <p>You may not assign this Agreement without Vanta&rsquo;s prior written consent. Vanta may assign this Agreement freely, including in connection with a merger, acquisition, or sale of&nbsp;assets.</p>

          <h4 className={heading4}>24.6 Force Majeure</h4>
          <p>Vanta is not liable for failures due to events beyond its reasonable control, including natural disasters, war, terrorism, pandemics, government actions, Sanctions, network failures, blockchain failures, cyberattacks, power outages, or third-party&nbsp;failures.</p>

          <h4 className={heading4}>24.9 Electronic Acceptance</h4>
          <p>You consent to electronic execution of this Agreement. Your electronic acceptance has the same legal effect as a physical&nbsp;signature.</p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Contact Information
   ─────────────────────────────────────────────── */
function ContactSection() {
  return (
    <section id="contact" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>Contact Information</span>
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-2">
          <p className="text-sm text-zinc-200 font-medium">Taoshi VT Services (Hyperscaled)</p>
          <p className="text-sm text-zinc-400">George Town, Grand Cayman, Cayman&nbsp;Islands</p>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-zinc-400">
              Legal Inquiries: <a href="mailto:legal@vantatrading.io" className="text-teal-400 hover:text-teal-300 transition-colors">legal@vantatrading.io</a>
            </p>
            <p className="text-sm text-zinc-400">
              General Support: <a href="mailto:support@vantatrading.io" className="text-teal-400 hover:text-teal-300 transition-colors">support@vantatrading.io</a>
            </p>
            <p className="text-sm text-zinc-400">
              Cancellation Requests: <a href="mailto:support@vantatrading.io" className="text-teal-400 hover:text-teal-300 transition-colors">support@vantatrading.io</a>
            </p>
            <p className="text-sm text-zinc-400">
              DMCA Agent: <a href="mailto:dmca@vantatrading.io" className="text-teal-400 hover:text-teal-300 transition-colors">dmca@vantatrading.io</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Main Page Component
   ─────────────────────────────────────────────── */
export default function TermsOfServicePage() {
  const activeId = useActiveSection()

  return (
    <div className="bg-[#09090b] text-white min-h-[100dvh]">
      <PageHero />
      <TableOfContents activeId={activeId} />

      <div className="relative" data-toc-content>
        <KeyTermsSection />
        <DefinitionsSection />
        <ServiceDescriptionSection />
        <EligibilitySection />
        <FeesSection />
        <RelationshipSection />
        <CapitalSection />
        <NetworkEmissionsSection />
        <EvaluationSection />
        <ConductSection />
        <IPSection />
        <ConfidentialitySection />
        <DataProtectionSection />
        <RiskSection />
        <DisclaimersSection />
        <LiabilitySection />
        <IndemnificationSection />
        <TerminationSection />
        <ModificationsSection />
        <DisputeSection />
        <GoverningLawSection />
        <RegulatorySection />
        <EUUKSection />
        <GeneralSection />
        <ContactSection />
      </div>
    </div>
  )
}
