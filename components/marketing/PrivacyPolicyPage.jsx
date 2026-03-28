'use client'

import { useEffect, useRef, useState } from 'react'

/* ───────────────────────────────────────────────
   TOC sections definition
   ─────────────────────────────────────────────── */
const TOC_SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'information-collected', label: 'Information Collected' },
  { id: 'use-of-information', label: 'Use of Information' },
  { id: 'data-sharing', label: 'Data Sharing' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'california', label: 'California Rights' },
  { id: 'security', label: 'Security' },
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
                className={`block text-xs py-1.5 transition-colors ${
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
  const [activeId, setActiveId] = useState('introduction')

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
const sectionLabel = 'text-xs font-mono text-teal-400 tracking-widest uppercase'
const bulletList = 'space-y-2 ml-5 list-disc marker:text-zinc-700'
const sectionWrap = 'px-6 pb-20 scroll-mt-[110px]'
const container = 'max-w-[900px] mx-auto'

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
          Privacy&nbsp;Policy
        </h1>
        <p
          className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-[62ch] mx-auto"
          style={{ textWrap: 'balance' }}
        >
          Vanta Trading and Hyperscaled Unified Privacy&nbsp;Policy
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Effective Date: March&nbsp;27,&nbsp;2026
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 1 — Introduction and Scope + Data Controller
   ─────────────────────────────────────────────── */
function IntroductionSection() {
  return (
    <section id="introduction" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>1. Introduction and Scope</span>
        <div className={`mt-4 space-y-4 ${prose}`}>
          <p>
            This Privacy Policy (&ldquo;Policy&rdquo;) describes how Taoshi VT Services, a Cayman Islands exempted company with limited liability (&ldquo;Vanta,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), collects, uses, discloses, and protects personal information when you access or use the Vanta Trading Challenge, the Hyperscaled Challenge, our websites, interfaces, browser extensions, dashboards, APIs, and related services, including the applicable Scaled Trader Program(s) where relevant (collectively, the &ldquo;Platform&rdquo;). This Policy applies to all visitors, users, and participants (&ldquo;you&rdquo; or &ldquo;your&rdquo;).
          </p>
          <p>
            By accessing or using the Platform, creating an account, linking or registering a wallet or other supported-venue identifier, installing or using a Vanta browser extension, or paying a Challenge Entry Fee, you acknowledge that you have read and understood this Policy. This Policy is not a contract that requires your agreement. Where we rely on your consent as a legal basis for processing (such as for non-essential cookies or direct marketing communications in certain jurisdictions), we obtain that consent separately, and you may withdraw it at any time without affecting the lawfulness of processing carried out before&nbsp;withdrawal.
          </p>
          <p>
            This Policy should be read together with the applicable Terms of Service and, if you are invited into a Scaled Trader Program, the applicable Independent Contractor Agreement (&ldquo;ICA&rdquo;). Capitalized terms not defined in this Policy have the meanings assigned in the applicable Terms of Service or ICA, as the context&nbsp;requires.
          </p>
        </div>

        {/* Section 2 — Data Controller */}
        <h3 className={heading3}>2. Data Controller</h3>
        <div className={`space-y-4 ${prose}`}>
          <p>
            For the purposes of the EU General Data Protection Regulation (&ldquo;GDPR&rdquo;), the UK General Data Protection Regulation (&ldquo;UK GDPR&rdquo;), and other applicable data protection laws, the controller of your personal information&nbsp;is:
          </p>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-sm text-zinc-200 font-medium">Taoshi VT Services</p>
            <p className="text-sm text-zinc-400">Cayman Islands Exempted Company</p>
            <p className="text-sm text-zinc-400 mt-2">
              Email: <a href="mailto:support@vantatrading.io" className="text-teal-400 hover:text-teal-300 transition-colors">support@vantatrading.io</a>
            </p>
            <p className="text-sm text-zinc-400">
              Address: PO Box 144, 3119 9 Forum Lane, Camana Bay, George Town, Grand Cayman KY1-9006, Cayman&nbsp;Islands
            </p>
          </div>
          <p>
            We have not appointed a Data Protection Officer (&ldquo;DPO&rdquo;). If a DPO is appointed in the future, their contact details will be published here. We have not appointed an EU or UK representative under Article 27 GDPR / UK GDPR. If such appointment becomes required, we will update this Policy&nbsp;accordingly.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 3 — Information We Collect
   ─────────────────────────────────────────────── */
function InformationCollectedSection() {
  return (
    <section id="information-collected" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>3. Information We Collect</span>
        <p className={`mt-4 mb-8 ${prose}`}>
          We collect information in several categories depending on your level of engagement with the Platform. Not all categories apply to all users, and certain data is collected only at specific stages of&nbsp;participation.
        </p>

        {/* 3.1 Core Account Data */}
        <h3 className={heading3}>3.1 Core Account Data (Collected at Signup)</h3>
        <p className={`mb-3 ${prose}`}>
          When you create an account, register for a Challenge, or link a wallet or other supported-venue identifier, we may&nbsp;collect:
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Email address</li>
          <li>Full name, display name, username, and, where applicable, your Registered Wallet address or other supported-venue&nbsp;identifier</li>
          <li>Account credentials (passwords are stored in hashed form; we also maintain authentication and security&nbsp;logs)</li>
          <li>IP address, device type, browser information, operating system, and application or extension version&nbsp;information</li>
          <li>Usage data, including login timestamps, platform activity, session duration, dashboard or browser-extension interaction logs, and related diagnostic or security&nbsp;logs</li>
        </ul>

        {/* 3.2 Trading and Performance Data */}
        <h3 className={heading3}>3.2 Trading and Performance Data</h3>
        <p className={`mb-3 ${prose}`}>
          We collect data related to your simulated trading activity and, for Hyperscaled or other supported-venue products, qualifying trading activity that is mirrored, copied, translated, or otherwise evaluated for Challenge or Program purposes,&nbsp;including:
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Simulated trading activity, mirrored or translated activity, order history, position data, and related wallet-linked or supported-venue activity&nbsp;records</li>
          <li>Profit and loss (PnL), returns, drawdowns, validated simulated performance, and other risk&nbsp;metrics</li>
          <li>Strategy behavior, execution logs, trading patterns, timestamps, instrument selection, and integrity or anti-abuse&nbsp;signals</li>
          <li>Evaluation results, scoring, eligibility status, Pass/Fail determinations, scaling status, and related review&nbsp;notes</li>
        </ul>

        {/* 3.3 Payment and Billing Data */}
        <h3 className={heading3}>3.3 Payment and Billing Data</h3>
        <p className={`mb-3 ${prose}`}>
          When you pay a Challenge Entry Fee or make other transactions through Vanta Trading or Hyperscaled, we may&nbsp;collect:
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Billing name and billing address, where applicable to the payment method&nbsp;used</li>
          <li>Transaction history, invoice records, wallet addresses used for payment or payout, blockchain transaction hashes, chain/network, token type, amount, timestamps, and payment or payout status, as&nbsp;applicable</li>
        </ul>
        <p className={`mt-3 ${prose}`}>
          For Vanta Trading, credit and debit card details are processed directly by our third-party payment processor (currently Stripe or a comparable provider) and are not stored on our servers. We receive only limited payment details such as tokenized references, last four digits, and transaction&nbsp;confirmations.
        </p>
        <p className={`mt-3 ${prose}`}>
          For Hyperscaled and other on-chain payment flows, we do not receive or store private keys or seed phrases, but we may receive and record blockchain payment details associated with your transaction, and those transactions may also be publicly visible on the relevant blockchain or&nbsp;network.
        </p>

        {/* 3.4 Post-Challenge, Payout, and KYC Data */}
        <h3 className={heading3}>3.4 Post-Challenge, Payout, and KYC Data (Conditional)</h3>
        <p className={`mb-3 ${prose}`}>
          If you pass a Challenge and become eligible for an invitation to a Scaled Trader Program or otherwise become payout-eligible, we may collect additional information as part of Know Your Customer (&ldquo;KYC&rdquo;) and Anti-Money Laundering (&ldquo;AML&rdquo;) compliance procedures. This data is collected only from payout-eligible individuals or where otherwise required for compliance, fraud prevention, or onboarding. Such data may&nbsp;include:
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Government-issued identification (e.g., passport, driver&rsquo;s license)</li>
          <li>Date of birth</li>
          <li>Residential address</li>
          <li>Nationality, tax residency, and related tax or beneficial-ownership information, as&nbsp;applicable</li>
          <li>Bank account details or cryptocurrency payout wallet address, depending on the payout rail&nbsp;used</li>
          <li>Results of compliance screening (including identity verification, liveness, sanctions, AML, fraud-prevention, and related compliance checks, as&nbsp;applicable)</li>
        </ul>
        <p className={`mt-3 ${prose}`}>
          Government-issued identification, date of birth, and bank account details are sensitive personal information under certain privacy laws. We use this information only for the purposes described in Section 4 and do not use or disclose it for purposes beyond what is reasonably necessary for compliance, fraud prevention, onboarding, and payout&nbsp;administration.
        </p>
        <p className={`mt-3 ${prose}`}>
          We may use third-party services, such as Stripe Connect or Sumsub, to conduct identity verification and compliance checks. Depending on the flow, we may collect this information directly or the applicable provider may collect it on our behalf subject to its own terms and privacy&nbsp;notice.
        </p>

        {/* 3.5 Communications Data */}
        <h3 className={heading3}>3.5 Communications Data</h3>
        <p className={`mb-3 ${prose}`}>
          If you contact us for support or otherwise communicate with us, we may&nbsp;collect:
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Support tickets and email correspondence</li>
          <li>Communications through integrated platforms such as Discord or Slack, to the extent initiated by&nbsp;you</li>
        </ul>

        {/* 3.6 Automatically Collected Technical Data */}
        <h3 className={heading3}>3.6 Automatically Collected Technical Data</h3>
        <p className={`mb-3 ${prose}`}>
          We automatically collect certain technical information when you visit or use the Platform, including our websites, dashboards, and browser extensions, where&nbsp;applicable:
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li>IP address and approximate geolocation</li>
          <li>Browser type and version, device type, operating system, and application or extension version&nbsp;information</li>
          <li>Referring URLs, pages viewed, clickstream data, and interaction data across our websites, dashboards, or&nbsp;extensions</li>
          <li>Cookies, pixel tags, and similar tracking technologies (see Section&nbsp;8 below)</li>
        </ul>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 4–5 — How We Use Your Information + Legal Bases
   ─────────────────────────────────────────────── */
function UseOfInformationSection() {
  return (
    <section id="use-of-information" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>4. How We Use Your Information</span>
        <p className={`mt-4 mb-6 ${prose}`}>
          We use the information we collect for the following&nbsp;purposes:
        </p>

        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">4.1 Account Administration</h4>
            <p className={prose}>To create and manage your account, authenticate your identity or wallet linkage, maintain account security, and communicate with you about your account and the&nbsp;Platform.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">4.2 Challenge and Program Operations</h4>
            <p className={prose}>To register you for Vanta Trading or Hyperscaled Challenges, monitor and evaluate simulated trading activity, record qualifying supported-venue or wallet-linked activity where applicable, calculate performance metrics, administer Challenge Rules and Program Rules, and determine eligibility or&nbsp;status.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">4.3 Scaled Trader Program Administration</h4>
            <p className={prose}>To onboard traders who are invited to a Scaled Trader Program, administer ICA-related operations, validate simulated performance, calculate eligibility for service compensation, and manage payout&nbsp;administration.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">4.4 Payment Processing</h4>
            <p className={prose}>To process Challenge Entry Fees, on-chain fee payments, issue invoices, manage disputes, refunds, or corrective actions where applicable, and maintain billing, accounting, tax, and transaction&nbsp;records.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">4.5 KYC/AML Compliance</h4>
            <p className={prose}>To verify your identity, confirm eligibility, conduct required compliance checks, and manage sanctions, AML, fraud-prevention, and related controls where required by Applicable Law or reasonably necessary for program&nbsp;integrity.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">4.6 Platform Improvement and Analytics</h4>
            <p className={prose}>To analyze usage patterns, diagnose technical issues, improve Platform functionality, and develop new&nbsp;features.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">4.7 Security and Fraud Prevention</h4>
            <p className={prose}>To detect, investigate, and prevent fraudulent activity, unauthorized access, abuse of the Platform, wallet compromise, prohibited conduct, multi-accounting, strategy cloning or correlation, and violations of the applicable Terms of Service, Challenge Rules, ICA, or Program&nbsp;Rules.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">4.8 Communications</h4>
            <p className={prose}>To send you transactional messages (e.g., account confirmations, Challenge status updates, payment receipts, payout notices, and security alerts) and respond to your inquiries. Where permitted and, where required by Applicable Law, with your consent, we may also send promotional or informational communications. You may opt out of non-transactional marketing communications at any&nbsp;time.</p>
          </div>
        </div>

        {/* Section 5 — EU/UK Legal Bases */}
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-16 mb-4">
          5. EU/UK Legal Bases and Required&nbsp;Disclosures
        </h3>
        <p className={`mb-6 ${prose}`}>
          If you are located in the European Economic Area (&ldquo;EEA&rdquo;), the United Kingdom, or Switzerland, we process your personal data only where we have a valid legal basis under the GDPR or UK&nbsp;GDPR.
        </p>

        {/* Desktop table */}
        <div className="hidden md:block rounded-lg border border-white/[0.06] overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">Processing Purpose</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">Categories of Data</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 tracking-widest uppercase font-medium">Legal Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <tr>
                <td className="px-4 py-3 text-zinc-200 font-medium align-top">Account administration; Challenge and Program&nbsp;operations</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Core account data; trading and performance data; wallet or supported-venue&nbsp;identifiers</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Performance of a contract; legitimate interests (service administration and&nbsp;integrity)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-zinc-200 font-medium align-top">Payment processing</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Payment and billing&nbsp;data</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Performance of a contract; compliance with legal obligations (tax and&nbsp;recordkeeping)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-zinc-200 font-medium align-top">KYC/AML compliance</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Post-challenge / payout / KYC&nbsp;data</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Compliance with legal obligations; legitimate interests (platform integrity and fraud&nbsp;prevention)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-zinc-200 font-medium align-top">Security and fraud prevention</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Core account data; technical data; trading data; wallet or supported-venue&nbsp;data</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Legitimate interests (platform security, fraud prevention, program integrity); compliance with legal obligations where&nbsp;applicable</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-zinc-200 font-medium align-top">Analytics and product improvement</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Technical data; usage&nbsp;data</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Legitimate interests (service improvement); consent for non-essential cookies where&nbsp;required</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-zinc-200 font-medium align-top">Marketing communications</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Email address;&nbsp;name</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Consent where required by law; otherwise, legitimate interests with&nbsp;opt-out</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-zinc-200 font-medium align-top">Legal compliance and dispute resolution</td>
                <td className="px-4 py-3 text-zinc-400 align-top">All categories as&nbsp;relevant</td>
                <td className="px-4 py-3 text-zinc-400 align-top">Compliance with legal obligations; legitimate interests (exercising or defending legal&nbsp;claims)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="md:hidden space-y-4 mb-6">
          {[
            { purpose: 'Account administration; Challenge and Program operations', data: 'Core account data; trading and performance data; wallet or supported-venue identifiers', basis: 'Performance of a contract; legitimate interests (service administration and integrity)' },
            { purpose: 'Payment processing', data: 'Payment and billing data', basis: 'Performance of a contract; compliance with legal obligations (tax and recordkeeping)' },
            { purpose: 'KYC/AML compliance', data: 'Post-challenge / payout / KYC data', basis: 'Compliance with legal obligations; legitimate interests (platform integrity and fraud prevention)' },
            { purpose: 'Security and fraud prevention', data: 'Core account data; technical data; trading data; wallet or supported-venue data', basis: 'Legitimate interests (platform security, fraud prevention); compliance with legal obligations' },
            { purpose: 'Analytics and product improvement', data: 'Technical data; usage data', basis: 'Legitimate interests (service improvement); consent for non-essential cookies' },
            { purpose: 'Marketing communications', data: 'Email address; name', basis: 'Consent where required by law; otherwise, legitimate interests with opt-out' },
            { purpose: 'Legal compliance and dispute resolution', data: 'All categories as relevant', basis: 'Compliance with legal obligations; legitimate interests (legal claims)' },
          ].map((row) => (
            <div key={row.purpose} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Purpose</span>
                <p className="text-sm text-zinc-200 font-medium mt-0.5">{row.purpose}</p>
              </div>
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Data</span>
                <p className="text-sm text-zinc-400 mt-0.5">{row.data}</p>
              </div>
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Legal Basis</span>
                <p className="text-sm text-zinc-400 mt-0.5">{row.basis}</p>
              </div>
            </div>
          ))}
        </div>

        <p className={prose}>
          <strong className="text-zinc-300">Legitimate Interests Statement.</strong> Where we rely on legitimate interests as a legal basis, our interests include ensuring the security and integrity of the Platform and the Challenge; preventing fraud, abuse, manipulation, multi-accounting, and strategy cloning or correlation; analyzing and improving our services; and exercising or defending legal claims. We balance these interests against your rights and freedoms and do not process personal data where our interests are overridden by the impact on&nbsp;you.
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 6–7 — Data Sharing + International Transfers
   ─────────────────────────────────────────────── */
function DataSharingSection() {
  return (
    <section id="data-sharing" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>6. How We Share Your Information</span>
        <p className={`mt-4 mb-6 ${prose}`}>
          We do not sell your personal information. We may share your information in the following&nbsp;circumstances:
        </p>

        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">6.1 Service Providers</h4>
            <p className={prose}>We share information with third-party vendors and service providers who perform services on our behalf, such as payment processing (including Stripe or comparable providers), cloud hosting and infrastructure (currently Google Cloud Platform), analytics, KYC/AML and identity verification services (including Sumsub or comparable providers), customer support tools, and email delivery services. These providers are contractually obligated to use your information only as necessary to provide their services to us and in accordance with this&nbsp;Policy.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">6.2 Network Participants and On-Chain Data</h4>
            <p className={prose}>Because the Platform may interact with decentralized networks, public blockchains, and supported third-party venues, certain activity data (such as registered wallet addresses, trade or position data, performance metrics, and on-chain payment details) may be recorded on, derived from, or visible through those systems in accordance with their protocols. Data recorded on Subnet 8, public blockchains, or similar decentralized systems may be public and may be difficult or impossible to modify, correct, or delete due to the immutable or distributed nature of those systems. We do not control those systems or how third parties may use publicly available&nbsp;data.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">6.3 Legal and Regulatory Requirements</h4>
            <p className={prose}>We may disclose your information if required to do so by Applicable Law, regulation, legal process, or governmental request, or if we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others, investigate fraud, or respond to a government&nbsp;request.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">6.4 Business Transfers</h4>
            <p className={prose}>In connection with any merger, acquisition, sale of assets, financing, or transfer of all or a portion of our business, your information may be transferred as part of that transaction. We will notify you by email and/or prominent notice on the Platform of any change in ownership or material changes to the use of your personal&nbsp;information.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-1">6.5 With Your Consent</h4>
            <p className={prose}>We may share your information for other purposes with your express&nbsp;consent.</p>
          </div>
        </div>

        {/* Section 7 — International Data Transfers */}
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-16 mb-4">
          7. International Data&nbsp;Transfers
        </h3>
        <div className={`space-y-4 ${prose}`}>
          <p>
            Vanta is organized under the laws of the Cayman Islands. Your personal information is primarily stored and processed using Google Cloud Platform infrastructure, which may involve processing in the United States and other jurisdictions where Google Cloud operates data&nbsp;centers.
          </p>
          <p>
            Where your personal information is transferred outside the EEA, the United Kingdom, or Switzerland, we ensure that appropriate safeguards are in place as required by Applicable Law. These safeguards currently&nbsp;include:
          </p>
          <ul className={bulletList}>
            <li>Google Cloud&rsquo;s Data Processing and Security Terms, which incorporate the Standard Contractual Clauses (&ldquo;SCCs&rdquo;) approved by the European Commission and the UK International Data Transfer Addendum (&ldquo;UK IDTA&rdquo;), as&nbsp;applicable</li>
            <li>Where we engage other service providers, we rely on SCCs, the UK IDTA, transfers to countries recognized as providing an adequate level of data protection, or other lawful transfer mechanisms as&nbsp;appropriate</li>
            <li>Additional technical and organizational measures as appropriate to supplement contractual&nbsp;safeguards</li>
          </ul>
          <p>
            We may change or supplement our infrastructure and service providers from time to time. Where we do so, we will ensure that equivalent or stronger transfer safeguards remain in place. You may request a copy of the relevant transfer safeguards by contacting us using the details in Section&nbsp;15.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 8 — Cookies and Tracking Technologies
   ─────────────────────────────────────────────── */
function CookiesSection() {
  return (
    <section id="cookies" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>8. Cookies and Tracking Technologies</span>
        <p className={`mt-4 mb-6 ${prose}`}>
          We use cookies, pixel tags, web beacons, and similar tracking technologies to collect information about your interactions with the&nbsp;Platform.
        </p>

        {/* 8.1 Types of Cookies */}
        <h3 className={heading3}>8.1 Types of Cookies</h3>
        <p className={`mb-3 ${prose}`}>
          We use the following categories of cookies and similar&nbsp;technologies:
        </p>
        <ul className={`${bulletList} ${prose} mb-6`}>
          <li>
            <strong className="text-zinc-300">Strictly Necessary Cookies.</strong> These cookies are essential for the Platform to function (e.g., session authentication, security tokens). They cannot be disabled without affecting Platform functionality and do not require your&nbsp;consent.
          </li>
          <li>
            <strong className="text-zinc-300">Analytics and Performance Cookies.</strong> These cookies help us understand how visitors interact with the Platform, diagnose technical issues, and improve our&nbsp;services.
          </li>
          <li>
            <strong className="text-zinc-300">Marketing and Advertising Cookies.</strong> If used, these cookies track your activity across sites to deliver relevant&nbsp;advertising.
          </li>
        </ul>

        {/* 8.2 Consent for Non-Essential Cookies — COOKIE SETTINGS LINK */}
        <h3 className={heading3}>8.2 Consent for Non-Essential Cookies (EU/UK Users)</h3>
        <p className={prose}>
          Where required by Applicable Law (including the ePrivacy Directive and UK PECR), we deploy non-essential cookies (analytics and marketing) only with your prior consent, obtained through our cookie consent banner or preferences center. You may update your preferences at any time by visiting{' '}
          <a
            href="#cookie-settings"
            id="cookie-settings"
            className="text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
          >
            Cookie Preferences
          </a>
          . Withdrawal of consent does not affect the lawfulness of processing carried out before&nbsp;withdrawal.
        </p>

        {/* 8.3 Do Not Track */}
        <h3 className={heading3}>8.3 Do Not Track</h3>
        <p className={prose}>
          We do not currently respond to &ldquo;Do Not Track&rdquo; browser signals. Where available, you may manage your tracking preferences through our cookie preferences&nbsp;center.
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 9 — Data Retention
   ─────────────────────────────────────────────── */
function RetentionSection() {
  return (
    <section id="retention" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>9. Data Retention</span>
        <p className={`mt-4 mb-6 ${prose}`}>
          We retain your personal information for as long as reasonably necessary to fulfill the purposes for which it was collected, including to satisfy legal, regulatory, accounting, or reporting requirements. Retention periods vary by data category and the legal basis for&nbsp;processing:
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li>
            <strong className="text-zinc-300">Account, trading, and wallet-linked data</strong> is retained for the duration of your account and for a reasonable period thereafter (generally no longer than three years for audit, compliance, and dispute resolution purposes, unless a longer period is required by Applicable&nbsp;Law).
          </li>
          <li>
            <strong className="text-zinc-300">Payment and transaction records</strong> are retained as required by Applicable Law, payment-network rules, blockchain or payment recordkeeping requirements, and tax obligations (typically five to seven&nbsp;years).
          </li>
          <li>
            <strong className="text-zinc-300">KYC/AML data</strong> is retained for the period required by Applicable Law, which may be five years or more following the end of the business&nbsp;relationship.
          </li>
          <li>
            <strong className="text-zinc-300">Communications data</strong> (support tickets, correspondence) is retained for as long as necessary to resolve the matter and for a reasonable period thereafter for quality assurance and dispute&nbsp;resolution.
          </li>
          <li>
            <strong className="text-zinc-300">Usage and technical data</strong> is generally retained in aggregated or anonymized form and may be retained indefinitely for analytics purposes. Aggregated or anonymized data that can no longer be linked to an identifiable individual is not considered personal&nbsp;data.
          </li>
        </ul>
        <p className={`mt-4 ${prose}`}>
          When personal information is no longer required, we will securely delete or anonymize it in accordance with our data retention procedures. Public blockchain or decentralized-network data may remain available outside Vanta&rsquo;s&nbsp;control.
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 10–11 — Your Rights + Automated Decision-Making
   ─────────────────────────────────────────────── */
function YourRightsSection() {
  return (
    <section id="your-rights" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>10. Your Rights</span>
        <p className={`mt-4 mb-6 ${prose}`}>
          Depending on your jurisdiction, you may have certain rights regarding your personal information. This section describes rights that may be available to you. Not all rights are available in all&nbsp;jurisdictions.
        </p>

        {/* 10.1 General Rights */}
        <h3 className={heading3}>10.1 General Rights</h3>
        <p className={`mb-3 ${prose}`}>Subject to Applicable Law, you may have the right&nbsp;to:</p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Access your personal information and obtain a copy of the data we hold about&nbsp;you</li>
          <li>Correct inaccurate or incomplete personal&nbsp;information</li>
          <li>Delete your personal information, subject to certain exceptions (e.g., legal retention obligations, ongoing&nbsp;disputes)</li>
          <li>Portability &mdash; receive your personal information in a structured, commonly used, machine-readable&nbsp;format</li>
          <li>Opt out of non-transactional marketing communications at any&nbsp;time</li>
        </ul>

        {/* 10.2 Additional Rights for EU/UK */}
        <h3 className={heading3}>10.2 Additional Rights for EU/UK Data Subjects</h3>
        <p className={`mb-3 ${prose}`}>If you are located in the EEA, United Kingdom, or Switzerland, you additionally have the right&nbsp;to:</p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Restrict processing of your personal data in certain circumstances (e.g., while we verify the accuracy of your data following a challenge to its&nbsp;accuracy)</li>
          <li>Object to processing based on legitimate interests. We will cease processing unless we demonstrate compelling legitimate grounds that override your interests, rights, and freedoms, or the processing is necessary for the establishment, exercise, or defense of legal&nbsp;claims.</li>
          <li>Withdraw consent at any time where processing is based on consent, without affecting the lawfulness of processing carried out before&nbsp;withdrawal</li>
          <li>Lodge a complaint with your local data protection supervisory authority (e.g., the ICO in the United Kingdom, the CNIL in France, or your relevant national authority in the&nbsp;EEA)</li>
        </ul>

        <p className={`mt-4 ${prose}`}>
          To exercise any of these rights, please contact us using the information in Section 15. We will respond to your request within the time frames required by Applicable Law (generally within thirty days for GDPR/UK GDPR requests). We may need to verify your identity before processing your&nbsp;request.
        </p>

        <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className={prose}>
            <strong className="text-zinc-300">Blockchain Data Limitation.</strong> Data recorded on public blockchains, supported venues, or decentralized networks (including Subnet 8 and, where applicable, wallet-linked activity used for Hyperscaled) may be technically impossible to modify, correct, or delete. Your rights under this Section apply to off-chain records maintained by Vanta. We will inform you if a request cannot be fully fulfilled due to on-chain or decentralized-network data&nbsp;limitations.
          </p>
        </div>

        {/* Section 11 — Automated Decision-Making */}
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-16 mb-4">
          11. Automated Decision-Making and&nbsp;Profiling
        </h3>
        <div className={`space-y-4 ${prose}`}>
          <p>
            Your Challenge trading activity and, for Hyperscaled or other supported-venue products, qualifying activity from your Registered Wallet or supported venue are evaluated against published performance criteria (as set out in the Challenge Rules or Program Rules) using automated scoring and analysis systems. These systems calculate metrics such as profit and loss, drawdowns, risk parameters, and integrity signals, which contribute to eligibility determinations (e.g., Pass or&nbsp;Fail).
          </p>
          <p>
            While initial scoring is automated, significant decisions regarding your Challenge or Program eligibility, including any determination that may result in disqualification for suspected rule violations, payout ineligibility, or other enforcement action, are subject to review and meaningful human involvement before a final outcome is&nbsp;applied.
          </p>
          <p>
            If you believe an automated decision has been made in error, or if you wish to contest an eligibility determination, you may contact us at the details in Section 15 to request a&nbsp;review.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Section 12 — California Privacy Rights
   ─────────────────────────────────────────────── */
function CaliforniaSection() {
  return (
    <section id="california" className={sectionWrap}>
      <div className={container}>
        <span className={sectionLabel}>12. California Privacy Rights (CCPA / CPRA)</span>
        <p className={`mt-4 mb-6 ${prose}`}>
          This section applies to California residents and supplements the rest of this Policy with information required by the California Consumer Privacy Act, as amended by the California Privacy Rights Act (&ldquo;CCPA/CPRA&rdquo;).
        </p>

        {/* 12.1 Categories of Personal Information Collected */}
        <h3 className={heading3}>12.1 Categories of Personal Information Collected</h3>
        <p className={`mb-3 ${prose}`}>
          In the preceding twelve months, we have collected the following categories of personal information (as defined by the CCPA/CPRA):
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li><strong className="text-zinc-300">Identifiers:</strong> name, email address, username, IP address, account credentials, Registered Wallet address, and other account or supported-venue&nbsp;identifiers</li>
          <li><strong className="text-zinc-300">Financial information:</strong> billing address, transaction history, invoices, on-chain payment details, and payout information. (Payment card data is processed by Stripe or another payment processor and not stored by&nbsp;us.)</li>
          <li><strong className="text-zinc-300">Internet or network activity:</strong> browsing history on the Platform, login data, usage data, cookies, clickstream data, and platform or extension interaction&nbsp;data</li>
          <li><strong className="text-zinc-300">Geolocation data:</strong> approximate location derived from IP&nbsp;address</li>
          <li><strong className="text-zinc-300">Professional or employment-related information:</strong> simulated trading performance data, strategy behavior, evaluation results, and program eligibility or payout&nbsp;status</li>
          <li><strong className="text-zinc-300">Sensitive personal information (conditional):</strong> government-issued ID, date of birth, and, where applicable, bank account details, crypto wallet address, or comparable verification information, collected only from payout-eligible individuals or others requiring enhanced&nbsp;verification</li>
        </ul>

        {/* 12.2 Categories Disclosed */}
        <h3 className={heading3}>12.2 Categories Disclosed for a Business Purpose</h3>
        <p className={`mb-3 ${prose}`}>
          We may disclose the following categories to service providers and third parties for business&nbsp;purposes:
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Identifiers (to payment processors, cloud providers, analytics providers, KYC vendors, support providers, and similar service&nbsp;providers)</li>
          <li>Financial information (to payment processors, payout providers, and accounting or tax providers where&nbsp;applicable)</li>
          <li>Internet or network activity (to analytics, security, and infrastructure&nbsp;providers)</li>
          <li>Sensitive personal information (to KYC/AML verification providers and payment or payout onboarding providers, only for payout-eligible&nbsp;individuals)</li>
        </ul>

        {/* 12.3 Sale and Sharing */}
        <h3 className={heading3}>12.3 Sale and Sharing</h3>
        <p className={prose}>
          We do not sell personal information as defined by the&nbsp;CCPA/CPRA.
        </p>

        {/* 12.4 Sensitive Personal Information */}
        <h3 className={heading3}>12.4 Sensitive Personal Information</h3>
        <p className={`mb-3 ${prose}`}>
          We may collect sensitive personal information (government ID, date of birth, bank/crypto details) only from payout-eligible individuals or others who require enhanced verification, and only for the following&nbsp;purposes:
        </p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Identity verification, KYC/AML compliance, sanctions screening, and fraud prevention as required by Applicable Law or reasonably necessary for program&nbsp;integrity</li>
          <li>Payout, tax, and onboarding administration under a separate Independent Contractor Agreement or related program&nbsp;documentation</li>
        </ul>
        <p className={`mt-3 ${prose}`}>
          We do not use or disclose sensitive personal information for purposes beyond what is reasonably necessary to provide the services or as otherwise permitted by the&nbsp;CCPA/CPRA.
        </p>

        {/* 12.5 Your California Rights */}
        <h3 className={heading3}>12.5 Your California Rights</h3>
        <p className={`mb-3 ${prose}`}>As a California resident, you have the right&nbsp;to:</p>
        <ul className={`${bulletList} ${prose}`}>
          <li>Know what categories and specific pieces of personal information we have collected about&nbsp;you</li>
          <li>Delete your personal information, subject to certain&nbsp;exceptions</li>
          <li>Correct inaccurate personal&nbsp;information</li>
          <li>Opt out of the sale or sharing of your personal information (if&nbsp;applicable)</li>
          <li>Limit the use of sensitive personal information to purposes authorized by the&nbsp;CCPA/CPRA</li>
          <li>Non-discrimination &mdash; we will not discriminate against you for exercising your privacy&nbsp;rights</li>
        </ul>

        {/* 12.6 How to Submit a Request */}
        <h3 className={heading3}>12.6 How to Submit a Request</h3>
        <p className={prose}>
          To submit a verifiable consumer request, contact us using the information in Section 15. You may also designate an authorized agent to submit a request on your behalf. If you use an authorized agent, we may require written proof of authorization and may verify your identity directly. We will respond to verified requests within forty-five days, with an extension of up to an additional forty-five days where reasonably necessary, as permitted by&nbsp;law.
        </p>
        <p className={`mt-3 ${prose}`}>
          <strong className="text-zinc-300">Appeal.</strong> If we deny your request in whole or in part, you may appeal by contacting us at the details in Section 15 with the subject line &ldquo;Privacy Appeal.&rdquo; We will respond to your appeal within the time frame required by Applicable&nbsp;Law.
        </p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────
   Sections 13–17 — Security, Children, Contact, Changes, Clarifications
   ─────────────────────────────────────────────── */
function SecurityAndContactSection() {
  return (
    <>
      {/* Section 13 — Data Security */}
      <section id="security" className={sectionWrap}>
        <div className={container}>
          <span className={sectionLabel}>13. Data Security</span>
          <div className={`mt-4 space-y-4 ${prose}`}>
            <p>
              We implement commercially reasonable administrative, technical, and physical safeguards designed to protect your personal information from unauthorized access, use, alteration, disclosure, or destruction. These measures include encryption of data in transit and at rest, access controls, regular security assessments, and employee training. Our primary cloud infrastructure provider (currently Google Cloud Platform) maintains industry-standard certifications including SOC 2 and ISO&nbsp;27001.
            </p>
            <p>
              However, no method of transmission over the Internet or method of electronic storage is completely secure. While we strive to protect your personal information, we cannot guarantee its absolute security. You are responsible for maintaining the confidentiality of your account credentials, the security of any Registered Wallet or Payout Wallet you use in connection with the Platform, and any activity that occurs under your account or attributable to your&nbsp;wallet.
            </p>
          </div>

          {/* Section 14 — Children's Privacy */}
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-16 mb-4">
            14. Children&rsquo;s&nbsp;Privacy
          </h3>
          <p className={prose}>
            The Platform is not directed to individuals under the age of 18, and we do not knowingly collect personal information from children under 18. If we learn that we have collected personal information from a child under 18, we will take steps to delete that information as promptly as practicable. If you believe we have inadvertently collected information from a child under 18, please contact us immediately using the information in Section&nbsp;15.
          </p>
        </div>
      </section>

      {/* Section 15 — Contact */}
      <section id="contact" className={sectionWrap}>
        <div className={container}>
          <span className={sectionLabel}>15. Contact Us</span>
          <p className={`mt-4 mb-4 ${prose}`}>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, or if you wish to exercise any of your rights described in this Policy, please contact&nbsp;us:
          </p>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-sm text-zinc-200 font-medium">Taoshi VT Services</p>
            <p className="text-sm text-zinc-400">Cayman Islands Exempted Company</p>
            <p className="text-sm text-zinc-400 mt-2">
              Email: <a href="mailto:support@vantatrading.io" className="text-teal-400 hover:text-teal-300 transition-colors">support@vantatrading.io</a>
            </p>
            <p className="text-sm text-zinc-400">
              Address: PO Box 144, 3119 9 Forum Lane, Camana Bay, George Town, Grand Cayman KY1-9006, Cayman&nbsp;Islands
            </p>
          </div>

          {/* Section 16 — Changes to This Policy */}
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-16 mb-4">
            16. Changes to This&nbsp;Policy
          </h3>
          <p className={prose}>
            We may update this Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make material changes, we will update the &ldquo;Effective Date&rdquo; at the top of this Policy and, where required by Applicable Law, provide additional notice (such as email notification or a prominent notice on the Platform). We encourage you to review this Policy periodically. Your continued use of the Platform after a revised Policy takes effect indicates your awareness of the updated&nbsp;practices.
          </p>

          {/* Section 17 — Important Clarifications */}
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-16 mb-4">
            17. Important&nbsp;Clarifications
          </h3>
          <p className={`mb-4 ${prose}`}>
            For the avoidance of doubt, the following clarifications apply to this Policy and the data practices described&nbsp;herein:
          </p>
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 mb-1">No Brokerage or Custodial Accounts</h4>
              <p className={prose}>Vanta does not operate brokerage accounts. All trading activity on the Platform during the Vanta Trading Challenge or the Hyperscaled Challenge is simulated. We do not hold custody of client funds, real assets, or securities at any time. In Hyperscaled and similar supported-venue products, you may trade through your own self-custodied account on a supported third-party venue using your own capital, while Vanta monitors qualifying activity on a read-only basis for evaluation or Program&nbsp;purposes.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 mb-1">No Direct Storage of Payment Card Data and Wallet Keys</h4>
              <p className={prose}>Full credit or debit card numbers are never stored on our servers. All payment card data is collected and processed directly by our PCI-compliant third-party payment processor. For Hyperscaled and other on-chain flows, we record transaction and wallet details necessary to administer the Service but do not collect or store private keys or seed&nbsp;phrases.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 mb-1">KYC Data Is Conditional</h4>
              <p className={prose}>Government-issued identification, date of birth, nationality, tax residency, and bank or crypto payout details are collected only from individuals who become payout-eligible or otherwise require enhanced verification for compliance, fraud prevention, or onboarding. This data is not collected from general participants unless needed for those&nbsp;purposes.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 mb-1">Optional Data and Wallet Identifiers</h4>
              <p className={prose}>Certain data fields (such as full name during the Challenge stage) may be optional. Where data collection is optional, it will be clearly indicated at the point of collection. For Hyperscaled, public wallet addresses and related supported-venue identifiers may function as core account or program&nbsp;identifiers.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200 mb-1">On-Chain Data</h4>
              <p className={prose}>Certain data submitted to or derived from public blockchains, supported venues, or decentralized networks (including Subnet 8) may become public or effectively immutable. Such data may be beyond Vanta&rsquo;s ability to modify or delete. This limitation is inherent to decentralized systems and public blockchain architecture and is not a result of Vanta&rsquo;s off-chain data handling&nbsp;practices.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

/* ───────────────────────────────────────────────
   Page Compose
   ─────────────────────────────────────────────── */
export default function PrivacyPolicyPage() {
  const activeId = useActiveSection()

  return (
    <>
      <PageHero />
      <TableOfContents activeId={activeId} />
      <div data-toc-content>
        <IntroductionSection />
        <InformationCollectedSection />
        <UseOfInformationSection />
        <DataSharingSection />
        <CookiesSection />
        <RetentionSection />
        <YourRightsSection />
        <CaliforniaSection />
        <SecurityAndContactSection />
      </div>
    </>
  )
}
