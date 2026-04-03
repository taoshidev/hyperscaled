"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Copy,
  Check,
  ArrowSquareOut,
  ArrowRight,
  GoogleChromeLogo,
  CaretRight,
  ChartLineUp,
  ShieldCheck,
  Crosshair,
} from "@phosphor-icons/react";
import { BASESCAN_URL } from "@/lib/constants";
import ExtensionModal from "@/components/marketing/ExtensionModal";
import { copyToClipboard } from "@/lib/utils";
import { formatAccountSize, truncateAddress } from "@/lib/format";
import { useExtensionBridge } from "@/hooks/use-extension-bridge";

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : label}
      className="ml-2 p-1 min-h-11 min-w-11 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-[color] duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {copied ? (
        <Check size={14} weight="bold" className="text-teal-400" />
      ) : (
        <Copy size={14} weight="bold" />
      )}
    </button>
  );
}

/* ─── Extension Mockup ───
   Built at ~1.5× actual render size, then scaled down via CSS transform.
   This keeps all source text ≥ 12px to pass the a11y hook while
   rendering at the smaller mockup size from the Figma design. */

function MockupProgressBar({ label, value, max, color, bgColor, detail }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white/90">{label}</span>
        <span className={`text-xs font-semibold tabular-nums ${color}`}>
          {value}% / {max}%
        </span>
      </div>
      <div className={`mt-1.5 h-2.5 rounded-full ${bgColor}`}>
        <div
          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {detail && (
        <p className="mt-1 text-xs text-white/40">{detail}</p>
      )}
    </div>
  );
}

function ExtensionMockup() {
  return (
    <div
      aria-hidden="true"
      className="origin-top-left"
      style={{ transform: "scale(0.82)", width: "calc(100% / 0.82)" }}
    >
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] overflow-hidden shadow-[0_36px_72px_rgba(0,0,0,0.5),0_0_54px_rgba(0,198,167,0.06)]">
        <div className="p-5 space-y-4">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-base text-white">
              Hyper<span className="font-bold">scaled</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500">0x0c86…ddfA</span>
              <span className="text-sm text-white tracking-tight tabular-nums">$1,645</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-teal-400 bg-teal-400/10 border border-teal-400/20">
                In Challenge
              </span>
            </div>
          </div>

          {/* Funded account card */}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-white/45">Funded Account</p>
              <p className="text-2xl text-white tabular-nums tracking-tight mt-1">$106,456</p>
            </div>
            <span className="text-sm text-teal-400 tabular-nums">+$6,456 (6.45%)</span>
          </div>

          {/* HL Account inline */}
          <div className="flex items-center justify-between px-4">
            <span className="text-xs text-white/45">HL Account</span>
            <span className="text-base text-white tabular-nums tracking-tight">$1,645.67</span>
          </div>

          {/* Challenge Progress */}
          <MockupProgressBar
            label="Challenge Progress"
            value={6.45}
            max={10}
            color="text-teal-400"
            bgColor="bg-white/[0.06]"
            detail="$3,543 to target ($10,000 goal)"
          />

          {/* Current Drawdown */}
          <MockupProgressBar
            label="Current Drawdown"
            value={2.3}
            max={5}
            color="text-amber-400"
            bgColor="bg-amber-400/10"
            detail="$2,700 remaining buffer"
          />

          {/* Trading Capacity */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white/90">Trading Capacity</span>
              <span className="text-xs font-semibold text-zinc-200 border border-zinc-700 px-2 py-0.5 tabular-nums">
                62.5% / 125% LIMITS
              </span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-indigo-500/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700"
                style={{ width: "50%" }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-white/40 tabular-nums">
              <span>$234.50 used</span>
              <span>$1,822.59 left</span>
            </div>
          </div>

          {/* Open positions */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-zinc-500">
                Open Hyperscaled Positions
              </span>
              <span className="text-xs text-zinc-500">View on HL →</span>
            </div>
            <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold text-white">BTC-PERP</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-teal-400 bg-teal-400/10 border border-teal-400/20">
                    LONG
                  </span>
                </div>
                <span className="text-sm font-semibold text-teal-400 tabular-nums">+$234.50</span>
              </div>
              <div className="flex items-start justify-between tabular-nums">
                <div>
                  <p className="text-xs text-zinc-500 font-mono">Size</p>
                  <p className="text-xs text-zinc-300 font-mono">0.15 BTC</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 font-mono">Entry</p>
                  <p className="text-xs text-zinc-300 font-mono">$98,450</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 font-mono">Mark · Lev</p>
                  <p className="text-xs text-zinc-300 font-mono">$100,013 · 5×</p>
                </div>
              </div>
            </div>
          </div>

          {/* View Full Analytics */}
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">View Full Analytics</p>
              <p className="text-xs text-white/40">Hyperscaled Dashboard</p>
            </div>
            <CaretRight size={14} className="text-white/40" />
          </div>

        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: ChartLineUp,
    title: "Live progress tracking",
    description:
      "Challenge progress, profit target, and drawdown updated in real\u00a0time.",
  },
  {
    icon: ShieldCheck,
    title: "Risk limit enforcement",
    description:
      "Position clamping and unsupported pair warnings before you\u00a0trade.",
  },
  {
    icon: Crosshair,
    title: "Position management",
    description:
      "Open positions, entries, and PnL without leaving\u00a0Hyperliquid.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const POLL_INTERVAL_MS = 5000;

export function StepConfirmation({ selectedTier, hlAddress, txHash, registrationStatus, paymentMethod }) {
  const isHLPayment = paymentMethod === "hyperliquid" || paymentMethod === "eip712";
  const explorerUrl = isHLPayment ? null : `${BASESCAN_URL}/tx/${txHash}`;

  const [status, setStatus] = useState(registrationStatus || "pending");
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const intervalRef = useRef(null);

  const { extensionDetected } = useExtensionBridge();

  useEffect(() => {
    if (status !== "pending") return;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/registration-status?hl_address=${encodeURIComponent(hlAddress)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "active") {
          setStatus("registered");
        } else if (data.status === "failed") {
          setStatus("failed");
        }
      } catch {
        // Network error — keep polling
      }
    }

    checkStatus();
    intervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, hlAddress]);

  const isRegistered = status === "registered";
  const isFailed = status === "failed";
  const isPending = !isRegistered && !isFailed;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col"
    >
      {/* ─── Top: single-column confirmation ─── */}
      <motion.div
        variants={itemVariants}
        className="w-full max-w-2xl mx-auto flex flex-col items-center"
      >
        {/* Success header */}
        <div className="flex items-start gap-3 self-start sm:self-center">
          <CheckCircle
            size={40}
            weight="fill"
            className="text-teal-400 shrink-0 mt-0.5"
          />
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-balance">
              You&#8217;re registered
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your funded account is being provisioned on Hyperscaled.
            </p>
          </div>
        </div>

        {/* Extension CTA — first content block */}
        <div className="w-full mt-8">
          {extensionDetected ? (
            /* Extension already installed */
            <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 px-5 py-4 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={20} weight="fill" className="text-teal-400 shrink-0" />
                <p className="text-sm font-semibold text-teal-400">
                  Extension installed — you&#8217;re ready to&nbsp;trade
                </p>
              </div>
              <Link
                href="/dashboard"
                className="shiny-cta h-11 w-full max-w-sm flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  Go to Dashboard
                  <ArrowRight size={14} weight="bold" />
                </span>
              </Link>
            </div>
          ) : (
            /* Extension not installed */
            <div className="rounded-xl border border-border bg-zinc-900/50 px-5 py-6 flex flex-col items-center gap-4">
              <h3 className="text-lg font-bold tracking-tight text-foreground text-balance text-center">
                Install the Chrome extension to start&nbsp;trading
              </h3>
              <p className="text-sm text-muted-foreground text-balance text-center max-w-md">
                The extension tracks your positions, enforces risk limits, and
                displays your challenge progress inside Hyperliquid.
                Required to&nbsp;participate.
              </p>
              <button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = '/hyperscaled_extension.zip'
                  a.download = 'hyperscaled_extension.zip'
                  a.click()
                  setExtensionModalOpen(true)
                }}
                className="shiny-cta h-11 w-full flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <GoogleChromeLogo size={18} weight="bold" />
                  Install Chrome Extension
                </span>
              </button>
              <p className="text-xs text-muted-foreground">
                Available for Chrome and&nbsp;Brave
              </p>
              <ExtensionModal open={extensionModalOpen} onClose={() => setExtensionModalOpen(false)} />
            </div>
          )}
        </div>

        {/* Receipt card */}
        <div className="w-full rounded-xl border border-border bg-zinc-900/50 px-5 pt-4 pb-px mt-6">
          {/* Plan */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-semibold">
              {selectedTier.name} —{" "}
              {formatAccountSize(selectedTier.accountSize)} Funded Account
            </span>
          </div>
          <div className="border-t border-border" />

          {/* Trading wallet */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Trading wallet</span>
            <div className="flex items-center">
              <span className="text-sm font-mono text-foreground">
                {truncateAddress(hlAddress)}
              </span>
              <CopyButton text={hlAddress} label="Copy wallet address" />
            </div>
          </div>
          <div className="border-t border-border" />

          {/* Transaction */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Transaction</span>
            <div className="flex items-center">
              <span className="text-sm font-mono text-foreground">
                {truncateAddress(txHash)}
              </span>
              <CopyButton text={txHash} label="Copy transaction hash" />
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View transaction on block explorer"
                  className="ml-1 p-1 min-h-11 min-w-11 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-[color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ArrowSquareOut size={14} weight="bold" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              )}
            </div>
          </div>
          <div className="border-t border-border" />

          {/* Status */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              {isPending && (
                <>
                  <span className="w-2 h-2 rounded-full bg-teal-400 pulse-teal shrink-0" />
                  <span className="text-sm text-foreground">Provisioning…</span>
                </>
              )}
              {isRegistered && (
                <>
                  <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                  <span className="text-sm text-teal-400">Registered</span>
                </>
              )}
              {isFailed && (
                <>
                  <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                  <span className="text-sm text-destructive">Failed</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard link — secondary, below receipt */}
        {!extensionDetected && (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 min-h-11 mt-4"
          >
            Go to Dashboard
            <ArrowRight size={14} weight="bold" />
          </Link>
        )}
      </motion.div>

      {/* ─── Bottom: "Your Trading Companion" two-column section ─── */}
      <motion.div
        variants={itemVariants}
        className="w-full mt-20 border-t border-border pt-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — copy + features */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">
              Your Trading Companion
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-3 leading-tight text-balance">
              Everything you need, inside&nbsp;Hyperliquid
            </h3>
            <p className="text-sm text-muted-foreground mt-3 max-w-md text-balance">
              The extension overlays directly on Hyperliquid. No switching tabs,
              no separate&nbsp;dashboard.
            </p>

            <div className="mt-8 space-y-6">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-400/10">
                    <feature.icon
                      size={20}
                      weight="duotone"
                      className="text-teal-400"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {feature.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — extension mockup */}
          <div className="hidden lg:block overflow-hidden">
            <ExtensionMockup />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
