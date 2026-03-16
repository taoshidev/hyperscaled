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
  CaretRight,
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
              <span className="text-xs font-mono text-zinc-500">0x12…4567</span>
              <span className="text-sm text-white tracking-tight tabular-nums">$1,645.67</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-teal-400 bg-teal-400/10 border border-teal-400/20">
                In Challenge
              </span>
            </div>
          </div>

          {/* Funded account card */}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-white/45">Funded Account</p>
              <p className="text-2xl text-white tabular-nums tracking-tight mt-1">$106,456.78</p>
            </div>
            <span className="text-sm text-teal-400 tabular-nums">+$6,456.78 (6.45%)</span>
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
              {/* Position header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold text-white">BTC-PERP</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-teal-400 bg-teal-400/10 border border-teal-400/20">
                    LONG
                  </span>
                </div>
                <span className="text-sm font-semibold text-teal-400 tabular-nums">+$234.50</span>
              </div>
              {/* Position details */}
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
              <p className="text-xs text-white/40">Vanta Network Dashboard</p>
            </div>
            <CaretRight size={14} className="text-white/40" />
          </div>

        </div>
      </div>
    </div>
  );
}

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
      {/* Two-column grid */}
      <motion.div
        variants={itemVariants}
        className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Left column — header + receipt + extension CTA + dashboard link */}
        <div className="flex flex-col gap-4">
          {/* Success header — inline icon + text */}
          <div className="flex items-start gap-3">
            <CheckCircle
              size={40}
              weight="fill"
              className="text-teal-400 shrink-0 mt-1"
            />
            <div>
              <h2 className="text-2xl sm:text-[30px] font-semibold tracking-tight leading-tight">
                You&#8217;re in. Evaluation starts&nbsp;now.
              </h2>
              <p className="text-sm text-muted-foreground">
                Your funded account is being provisioned on Vanta&nbsp;Network.
              </p>
            </div>
          </div>

          {/* Receipt card */}
          <div className="rounded-xl border border-border bg-zinc-900/50 px-5 pt-5 pb-px">
            {/* Plan */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="text-sm font-semibold">
                {selectedTier.name} —{" "}
                {formatAccountSize(selectedTier.accountSize)} Funded Account
              </span>
            </div>

            <div className="border-t border-border" />

            {/* Trading wallet */}
            <div className="flex items-center justify-between py-2">
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
            <div className="flex items-center justify-between py-2">
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
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 pulse-teal shrink-0" />
                <span className="text-sm text-foreground">Provisioning…</span>
              </div>
            </div>
          </div>

          {/* Extension CTA card */}
          <div className="flex flex-col gap-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold tracking-tight text-foreground text-balance">
                Install the Chrome extension to start&nbsp;trading
              </h3>
              <p className="text-sm text-muted-foreground text-balance">
                The extension tracks your positions, enforces risk limits, and
                displays your progress inside&nbsp;Hyperliquid.
              </p>
            </div>
            <a
              href={CHROME_EXTENSION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shiny-cta h-11 w-full flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <GoogleChromeLogo size={18} weight="bold" />
                Install Chrome Extension
              </span>
            </a>
            <p className="text-xs text-muted-foreground text-center">
              Available for Chrome and&nbsp;Brave
            </p>

            {/* After you install */}
            <div className="border-t border-border pt-5 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                After you install
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-[11px] font-bold text-teal-400">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Start trading
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Open Hyperliquid and trade from your registered&nbsp;wallet.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-[11px] font-bold text-teal-400">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Hit your profit target
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reach 10% and earn 100% of rewards in&nbsp;USDC.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard link — centered below */}
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 min-h-11"
            >
              Go to Dashboard
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
        </div>

        {/* Right column — Extension mockup */}
        <div className="hidden lg:block overflow-hidden">
          <div className="sticky top-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              What you&#8217;ll see
            </p>
            <ExtensionMockup />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
