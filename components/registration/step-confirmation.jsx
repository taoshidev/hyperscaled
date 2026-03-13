"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Copy,
  Check,
  ArrowSquareOut,
  ArrowRight,
  GoogleChromeLogo,
  TrendUp,
} from "@phosphor-icons/react";
import { BASESCAN_URL, CHROME_EXTENSION_URL } from "@/lib/constants";
import { copyToClipboard } from "@/lib/utils";
import { formatAccountSize, truncateAddress } from "@/lib/format";

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

function ProgressBar({ label, current, max, color }) {
  const pct = (current / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className="text-white/70 font-medium tabular-nums">
          {current}% / {max}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ExtensionMockup({ selectedTier }) {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-[260px] rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-4 shadow-2xl shadow-black/60 rotate-[2deg]"
    >
      {/* Extension header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white tracking-tight">
          Hyperscaled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
          <span className="text-xs text-teal-400 font-medium">Active</span>
        </span>
      </div>

      {/* Account size */}
      <div className="mt-3">
        <p className="text-xs text-white/40 uppercase tracking-wider">
          Account Size
        </p>
        <p className="text-lg font-semibold text-white tabular-nums mt-0.5">
          {formatAccountSize(selectedTier.accountSize)}
        </p>
      </div>

      {/* Progress bars */}
      <div className="mt-3 space-y-2.5">
        <ProgressBar
          label="Profit"
          current={4.2}
          max={10}
          color="bg-teal-400"
        />
        <ProgressBar
          label="Drawdown"
          current={1.8}
          max={5}
          color="bg-amber-400"
        />
      </div>

      {/* Position row */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <TrendUp size={12} weight="bold" className="text-teal-400" />
          <span className="text-xs font-medium text-white/80">
            ETH-PERP
          </span>
          <span className="text-xs text-white/40">Long</span>
        </div>
        <span className="text-xs font-semibold text-teal-400 tabular-nums">
          +$1,240
        </span>
      </div>
    </div>
  );
}

const AFTER_INSTALL = [
  {
    title: "Start trading",
    description:
      "Open Hyperliquid and trade from your registered wallet. The extension tracks every position automatically.",
  },
  {
    title: "Hit your profit target",
    description:
      "Reach 10% and earn 100% of performance rewards in\u00a0USDC.",
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

export function StepConfirmation({ selectedTier, hlAddress, txHash }) {
  const explorerUrl = `${BASESCAN_URL}/tx/${txHash}`;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center"
    >
      {/* Success header */}
      <motion.div variants={itemVariants} className="text-center space-y-3">
        <CheckCircle
          size={64}
          weight="fill"
          className="text-teal-400 mx-auto"
        />
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          You&#8217;re in. Evaluation starts&nbsp;now.
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto text-balance">
          Your funded account is being provisioned on Vanta&nbsp;Network.
        </p>
      </motion.div>

      {/* Two-column split: receipt (left) + extension CTA (right) */}
      <motion.div
        variants={itemVariants}
        className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8"
      >
        {/* Left column — Receipt */}
        <div className="flex flex-col">
          <div className="rounded-xl border border-border bg-zinc-900/50 p-5 space-y-0">
            {/* Plan */}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="text-sm font-semibold">
                {selectedTier.name} —{" "}
                {formatAccountSize(selectedTier.accountSize)} Funded Account
              </span>
            </div>

            <div className="border-t border-border" />

            {/* Trading wallet */}
            <div className="flex items-center justify-between py-3">
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
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Transaction</span>
              <div className="flex items-center">
                <span className="text-sm font-mono text-foreground">
                  {truncateAddress(txHash)}
                </span>
                <CopyButton text={txHash} label="Copy transaction hash" />
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
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Status */}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 pulse-teal shrink-0" />
                <span className="text-sm text-foreground">Provisioning…</span>
              </div>
            </div>
          </div>

          {/* Dashboard link — below receipt */}
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 min-h-11 self-start"
          >
            Go to Dashboard
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Right column — Extension install */}
        <div className="flex flex-col items-center text-center">
          {/* Extension mockup */}
          <div className="mb-6">
            <ExtensionMockup selectedTier={selectedTier} />
          </div>

          <h3 className="text-lg font-semibold tracking-tight text-foreground text-balance">
            Install the Chrome extension to start&nbsp;trading
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto text-balance mt-2">
            The extension tracks your positions, enforces risk limits, and
            displays your progress inside&nbsp;Hyperliquid.
          </p>

          <a
            href={CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shiny-cta h-11 w-full max-w-sm flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background mt-4"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <GoogleChromeLogo size={18} weight="bold" />
              Install Chrome Extension
            </span>
          </a>
          <p className="text-xs text-muted-foreground mt-2">
            Available for Chrome and&nbsp;Brave
          </p>

          {/* After you install */}
          <div className="w-full max-w-sm text-left space-y-3 mt-6">
            <h4 className="text-sm font-semibold text-foreground">
              After you install
            </h4>
            <div className="space-y-2.5">
              {AFTER_INSTALL.map((step) => (
                <div key={step.title} className="flex items-start gap-2.5">
                  <span className="text-muted-foreground mt-0.5 shrink-0" aria-hidden="true">·</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground text-balance">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
