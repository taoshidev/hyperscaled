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
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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

const NEXT_STEPS = [
  {
    title: "Install the Chrome extension",
    description:
      "Track your evaluation progress directly inside\u00a0Hyperliquid.",
    href: CHROME_EXTENSION_URL,
    linkLabel: "Get the extension",
  },
  {
    title: "Start trading",
    description:
      "Your trades from the registered wallet are automatically tracked. Trade as you normally\u00a0would.",
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
      className="flex flex-col items-center space-y-8"
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

      {/* Registration summary card */}
      <motion.div
        variants={itemVariants}
        className="w-full max-w-lg rounded-xl border border-border bg-zinc-900/50 p-5 space-y-0"
      >
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
      </motion.div>

      {/* Next steps */}
      <motion.div variants={itemVariants} className="w-full max-w-lg space-y-5">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          What&#8217;s next
        </h3>
        <ol className="space-y-4">
          {NEXT_STEPS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3.5">
              <span className="shrink-0 w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center text-xs font-bold text-zinc-950">
                {i + 1}
              </span>
              <div className="space-y-0.5 pt-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground text-balance">
                  {step.description}
                </p>
                {step.href && (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-11 inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300 transition-[color] duration-200 mt-1"
                  >
                    {step.linkLabel}
                    <ArrowSquareOut size={12} weight="bold" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </motion.div>

      {/* Footer actions */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col items-center gap-3 pt-2"
      >
        <Link href="/dashboard">
          <Button className="h-11 px-8 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer">
            Go to Dashboard
            <ArrowRight size={15} weight="bold" className="ml-1.5" />
          </Button>
        </Link>
        <Link
          href="/leaderboard"
          className="min-h-11 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200"
        >
          View Leaderboard
        </Link>
      </motion.div>
    </motion.div>
  );
}
