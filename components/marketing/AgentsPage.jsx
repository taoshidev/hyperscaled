'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import {
  Terminal,
  Code,
  Package,
  Lightning,
  CheckCircle,
  ArrowSquareOut,
  ArrowRight,
} from '@phosphor-icons/react'
import Nav from './Nav'
import Footer from './Footer'

const spring = { type: 'spring', stiffness: 100, damping: 20 }
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const cardVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: spring },
}

// ─── Reusable inline terminal/code block ───────────────────────────────────

function CodeBlock({ lines }) {
  return (
    <div className="mt-5 rounded-xl bg-zinc-950 border border-white/[0.05] p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
      {lines.map((line, i) => (
        <div key={i} className={line.teal ? 'text-teal-400' : line.dim ? 'text-zinc-600' : 'text-zinc-300'}>
          {line.text}
        </div>
      ))}
    </div>
  )
}

// ─── Section A: Hero ──────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="min-h-[60dvh] flex items-center pt-16 px-6 py-20">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-400/8 border border-teal-400/20 mb-6">
              <span className="pulse-teal w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="text-xs text-teal-400 font-medium tracking-wide">
                Agent-First · Programmatic · Structured
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
              Agents,
              <br />
              <span className="text-teal-400">come as you are.</span>
            </h1>

            <p className="text-lg text-zinc-400 leading-relaxed max-w-[48ch] mb-8">
              LangChain, CrewAI, plain Python, or OpenClaw — no adapters, no rewrites.
              Hyperscaled works with whatever runtime your agent already runs on.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a href="#openclaw" className="shiny-cta px-5 py-2.5">
                <span className="flex items-center gap-1.5">
                  Install OpenClaw Skill
                  <ArrowRight size={15} weight="bold" />
                </span>
              </a>
              <a
                href="https://github.com/taoshidev/hyperscaled-sdk"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl text-sm text-zinc-300 border border-white/[0.08] hover:border-white/[0.18] hover:text-white transition-all flex items-center gap-1.5"
              >
                View Python SDK <ArrowSquareOut size={14} />
              </a>
            </div>
          </motion.div>

          {/* Terminal mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.1 }}
          >
            <div className="rounded-2xl bg-zinc-900 border border-white/[0.08] overflow-hidden">
              {/* Chrome bar */}
              <div className="flex items-center gap-1.5 px-5 py-4 border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <span className="ml-3 text-xs text-zinc-600 font-mono">terminal</span>
              </div>
              <div className="p-6 font-mono text-sm space-y-3">
                <div className="text-zinc-500">$ openclaw skills install hyperscaled</div>
                <div className="text-teal-400">✓ Skill installed: hyperscaled v1.4.2</div>
                <div className="text-teal-400">✓ Tools: register, trade, positions, orders, rules, payouts</div>
                <div className="border-t border-white/[0.05] pt-3 text-zinc-500">$ pip install hyperscaled</div>
                <div className="text-teal-400">✓ Successfully installed hyperscaled-1.4.2</div>
                <div className="border-t border-white/[0.05] pt-3 text-zinc-500">$ hyperscaled miners list --json</div>
                <div className="text-zinc-300">[</div>
                <div className="text-zinc-300 pl-4">{`{ "slug": "alpha-fund", "tier": 1, "max_account": 200000 },`}</div>
                <div className="text-zinc-300 pl-4">{`{ "slug": "delta-prop", "tier": 2, "max_account": 500000 }`}</div>
                <div className="text-zinc-300">]</div>
                <div className="border-t border-white/[0.05] pt-3 text-zinc-500">$ hyperscaled positions open --json</div>
                <div className="text-teal-400">✓ 2 open positions returned</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Section B: Value Strip ───────────────────────────────────────────────

const valueItems = [
  { icon: Package, label: 'PyPI Package', value: 'pip install hyperscaled' },
  { icon: Terminal, label: 'OpenClaw Skill', value: 'openclaw skills install hyperscaled' },
  { icon: CheckCircle, label: 'Automated Validation', value: 'Error handling built-in' },
  { icon: Lightning, label: 'Plug & Play', value: 'Drop into any agent runtime' },
]

function ValueStrip() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <section ref={ref} className="px-6 pb-8">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
        >
          {valueItems.map(({ icon: Icon, label, value }) => (
            <motion.div
              key={label}
              variants={cardVariants}
              className="bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-400/8 border border-teal-400/20 flex items-center justify-center shrink-0">
                <Icon size={22} className="text-teal-400" />
              </div>
              <div>
                <div className="text-sm text-zinc-400 mb-1 font-medium">{label}</div>
                <div className="text-sm font-mono text-zinc-200">{value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Section C: Integration Paths ────────────────────────────────────────

function IntegrationPaths() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="integrations" ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-12"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
            Integration Paths
          </span>
          <h2 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold max-w-xl">
            Four ways in. Pick your stack.
          </h2>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-12 gap-4"
        >
          {/* Card 1: OpenClaw Skill */}
          <motion.div
            variants={cardVariants}
            id="openclaw"
            className="md:col-span-7 relative bg-zinc-900/50 border border-teal-400/20 rounded-2xl p-6 overflow-hidden group hover:border-teal-400/40 transition-all duration-300 shiny-border"
          >
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none opacity-60"
              style={{ background: 'radial-gradient(circle at 10% 10%, rgba(0,198,167,0.06), transparent 60%)' }}
            />
            {/* Recommended badge */}
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-teal-400/10 border border-teal-400/20 text-[10px] text-teal-400 font-medium">
              Recommended
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-teal-400/8 border border-teal-400/20 flex items-center justify-center mb-4">
                <Package size={20} className="text-teal-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">OpenClaw Skill</h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-[40ch]">
                The fastest path. One command installs Hyperscaled into OpenClaw, exposing every
                action as a structured tool call with validated outputs.
              </p>
              <CodeBlock lines={[
                { text: '$ openclaw skills install hyperscaled', dim: false },
                { text: '✓ Installed: hyperscaled', teal: true },
                { text: '> register  trade  positions  orders  rules  payouts', teal: true },
              ]} />
              <div className="flex items-center gap-3 mt-5">
                <a href="https://clawhub.com" target="_blank" rel="noreferrer" className="shiny-cta px-4 py-2 text-sm">
                  <span className="flex items-center gap-1.5">
                    Install Skill
                    <ArrowRight size={14} weight="bold" />
                  </span>
                </a>
                <a
                  href="https://github.com/taoshidev/hyperscaled-sdk"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  View skill.md <ArrowSquareOut size={13} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Python SDK */}
          <motion.div
            variants={cardVariants}
            id="sdk"
            className="md:col-span-5 relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 overflow-hidden group hover:border-teal-400/20 transition-all duration-300"
          >
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'radial-gradient(circle at 15% 15%, rgba(0,198,167,0.07), transparent 60%)' }}
            />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-teal-400/8 border border-teal-400/20 flex items-center justify-center mb-4 group-hover:bg-teal-400/15 transition-colors">
                <Code size={20} className="text-teal-400" />
              </div>
              <h3 className="text-base md:text-lg font-bold tracking-tight text-white mb-2">Python SDK</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Full sync and async support. Pydantic models on every response. Works with LangChain,
                CrewAI, LlamaIndex, or plain Python.
              </p>
              <CodeBlock lines={[
                { text: 'from hyperscaled import HyperscaledClient' },
                { text: '' },
                { text: 'client = HyperscaledClient()' },
                { text: 'status = await client.account.get_info_async()' },
                { text: '# → AccountInfo(balance=201271.23, ...)', dim: true },
              ]} />
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-teal-400/20 font-mono text-xs text-teal-400">
                pip install hyperscaled
              </div>
            </div>
          </motion.div>

          {/* Card 3: CLI + --json */}
          <motion.div
            variants={cardVariants}
            className="md:col-span-5 relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 overflow-hidden group hover:border-teal-400/20 transition-all duration-300"
          >
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'radial-gradient(circle at 15% 15%, rgba(0,198,167,0.07), transparent 60%)' }}
            />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-teal-400/8 border border-teal-400/20 flex items-center justify-center mb-4 group-hover:bg-teal-400/15 transition-colors">
                <Terminal size={20} className="text-teal-400" />
              </div>
              <h3 className="text-base md:text-lg font-bold tracking-tight text-white mb-2">CLI + --json</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every command emits clean JSON with <code className="text-teal-400 text-xs">--json</code>. Pipe directly into{' '}
                <code className="text-teal-400 text-xs">jq</code>, any agent tool-call parser, or your orchestrator.
              </p>
              <CodeBlock lines={[
                { text: '$ hyperscaled positions open --json \\' },
                { text: '  | jq \'.[].unrealized_pnl\'' },
                { text: '142.50', teal: true },
                { text: '-31.20', teal: true },
              ]} />
            </div>
          </motion.div>

          {/* Card 4: PyPI Package */}
          <motion.div
            variants={cardVariants}
            className="md:col-span-7 relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 overflow-hidden group hover:border-teal-400/20 transition-all duration-300"
          >
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'radial-gradient(circle at 15% 15%, rgba(0,198,167,0.07), transparent 60%)' }}
            />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-teal-400/8 border border-teal-400/20 flex items-center justify-center mb-4 group-hover:bg-teal-400/15 transition-colors">
                <Package size={20} className="text-teal-400" />
              </div>
              <h3 className="text-base md:text-lg font-bold tracking-tight text-white mb-2">PyPI Package</h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-[42ch]">
                Install from PyPI and import directly into any Python project, notebook, or agent
                framework. Zero config to get started.
              </p>
              <CodeBlock lines={[
                { text: '# Standard install' },
                { text: 'pip install hyperscaled', teal: true },
                { text: '' },
                { text: '# With Hyperliquid SDK integration' },
                { text: 'pip install "hyperscaled[hl]"', teal: true },
              ]} />
              <div className="flex items-center gap-3 mt-5">
                <a
                  href="https://pypi.org/project/hyperscaled"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  PyPI <ArrowSquareOut size={13} />
                </a>
                <a
                  href="https://github.com/taoshidev/hyperscaled-sdk"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  GitHub <ArrowSquareOut size={13} />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Section D: Why Agents Love It ────────────────────────────────────────

const whyFeatures = [
  {
    icon: CheckCircle,
    title: 'Pydantic Everywhere',
    body: 'Every SDK response is a typed Pydantic model. No raw dict parsing, no .get() chains. Autocomplete works, mypy works, agents work.',
    span: 'md:col-span-6',
    extra: (
      <CodeBlock lines={[
        { text: 'AccountInfo(', dim: true },
        { text: '  balance=201271.23,', teal: true },
        { text: '  phase="funded",', teal: true },
        { text: '  profit_pct=4.2', teal: true },
        { text: ')', dim: true },
      ]} />
    ),
  },
  {
    icon: Lightning,
    title: 'Semantic Error Types',
    body: 'Errors have meaning. RuleViolationError, InsufficientFundsError, DrawdownBreachError — catch exactly what went wrong and respond programmatically.',
    span: 'md:col-span-6',
    extra: (
      <CodeBlock lines={[
        { text: 'except RuleViolationError as e:' },
        { text: '    # e.violations → list of rule details', dim: true },
        { text: '    handle_violation(e.violations)', teal: true },
      ]} />
    ),
  },
  {
    icon: CheckCircle,
    title: 'Pre-Submission Validation',
    body: "Catch rule violations before they hit the network. Agents don't blow evaluations on avoidable mistakes.",
    span: 'md:col-span-7',
    extra: (
      <div className="mt-5 grid grid-cols-2 gap-3">
        {['Drawdown Guard', 'Position Limits', 'Leverage Check', 'Margin Reserve'].map((r) => (
          <div key={r} className="p-3 rounded-xl bg-zinc-800/60 border border-white/[0.06] flex items-center gap-2">
            <CheckCircle size={13} className="text-teal-400 shrink-0" />
            <span className="text-xs text-zinc-300">{r}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: ArrowRight,
    title: 'Dual Sync/Async',
    body: 'One API, both paradigms. Use the same client in blocking scripts or async agent loops.',
    span: 'md:col-span-5',
    extra: (
      <div className="mt-5 grid grid-cols-1 gap-2">
        <div className="rounded-xl bg-zinc-950 border border-white/[0.05] p-3 font-mono text-xs text-zinc-300">
          client.account.get_info()
          <span className="text-zinc-600 ml-2"># sync</span>
        </div>
        <div className="rounded-xl bg-zinc-950 border border-white/[0.05] p-3 font-mono text-xs text-zinc-300">
          await client.account.get_info_async()
          <span className="text-zinc-600 ml-1"># async</span>
        </div>
      </div>
    ),
  },
  {
    icon: Code,
    title: 'Any Runtime',
    body: 'No framework lock-in. If it can call a Python function, it can use Hyperscaled.',
    span: 'md:col-span-6',
    extra: (
      <div className="mt-5 flex flex-wrap gap-2">
        {['LangChain', 'CrewAI', 'LlamaIndex', 'AutoGPT', 'Plain Python'].map((tag) => (
          <span key={tag} className="px-2.5 py-1 rounded-full border border-teal-400/20 bg-teal-400/5 text-[10px] text-teal-400 font-medium">
            {tag}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: Terminal,
    title: 'JSON-First CLI',
    body: '--json on every command. Designed for piping, scripting, and tool-call parsers. No screen-scraping.',
    span: 'md:col-span-6',
    extra: (
      <CodeBlock lines={[
        { text: '$ hyperscaled rules list --json' },
        { text: '[{"rule": "max_leverage", "limit": 10}, ...]', teal: true },
      ]} />
    ),
  },
]

function WhyAgentsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="why" ref={ref} className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-12"
        >
          <span className="text-xs text-zinc-500 tracking-widest uppercase block mb-4">
            Why Agents Love It
          </span>
          <h2 className="text-4xl md:text-6xl tracking-tighter leading-none font-bold max-w-xl">
            Built for programmatic access from day one.
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-12 gap-4"
        >
          {whyFeatures.map((feat) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                variants={cardVariants}
                className={`${feat.span} relative bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 overflow-hidden group hover:border-teal-400/20 transition-all duration-300`}
              >
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle at 15% 15%, rgba(0,198,167,0.07), transparent 60%)' }}
                />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-teal-400/8 border border-teal-400/20 flex items-center justify-center mb-4 group-hover:bg-teal-400/15 transition-colors">
                    <Icon size={20} className="text-teal-400" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold tracking-tight text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{feat.body}</p>
                  {feat.extra}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Section E: CTA Banner ────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="px-6 pb-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="relative rounded-2xl border border-teal-400/20 bg-zinc-900/50 p-12 md:p-16 text-center overflow-hidden">
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,198,167,0.08), transparent 60%)' }}
          />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4">
              Ready to connect your agent?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-[40ch] mx-auto">
              Install the OpenClaw skill or drop the Python SDK directly into your agent workflow.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <a href="https://clawhub.com" target="_blank" rel="noreferrer" className="shiny-cta px-6 py-2.5">
                <span className="flex items-center gap-1.5">
                  Install OpenClaw Skill
                  <ArrowRight size={15} weight="bold" />
                </span>
              </a>
              <a
                href="https://docs.hyperscaled.trade"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm text-zinc-300 border border-white/[0.08] hover:border-white/[0.18] hover:text-white transition-all"
              >
                Read the Docs <ArrowSquareOut size={14} />
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['Pydantic outputs', 'Semantic errors', 'Pre-submission rules'].map((chip) => (
                <span key={chip} className="px-3 py-1 rounded-full border border-white/[0.06] text-xs text-zinc-500">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page Root ────────────────────────────────────────────────────────────

export default function AgentsPage() {
  return (
    <div className="bg-[#09090b] text-white font-sans">
      <Nav />
      <main>
        <HeroSection />
        <ValueStrip />
        <IntegrationPaths />
        <WhyAgentsSection />
        <CTABanner />
      </main>
      <Footer />
    </div>
  )
}
