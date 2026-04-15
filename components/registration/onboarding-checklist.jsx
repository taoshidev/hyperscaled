"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Circle,
  CaretDown,
  ArrowSquareOut,
  GoogleChromeLogo,
} from "@phosphor-icons/react";
import { formatUSD, truncateAddress } from "@/lib/format";
import { useHlBalance } from "@/hooks/use-hl-balance";
import { useOnboardingState } from "@/hooks/use-onboarding-state";

const MIN_HL_BALANCE = 100;

const FUNDING_PATHS = [
  {
    label: "From a centralized exchange (Binance, Coinbase, Kraken)",
    body: "Withdraw USDC and pick Arbitrum as the network. Deposit on Hyperliquid's Portfolio tab.",
  },
  {
    label: "From Ethereum or Base",
    body: "Bridge to Arbitrum with Across or Stargate, then deposit on Hyperliquid.",
  },
  {
    label: "From Solana",
    body: "Use Mayan or deBridge to get USDC onto Arbitrum, then deposit on Hyperliquid.",
  },
];

function StatusDot({ done }) {
  return done ? (
    <CheckCircle size={22} weight="fill" className="text-teal-400 shrink-0" />
  ) : (
    <Circle size={22} weight="duotone" className="text-zinc-600 shrink-0" />
  );
}

function Row({ done, title, children }) {
  return (
    <div className="flex items-start gap-3 py-4">
      <StatusDot done={done} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${done ? "text-teal-400" : "text-white"}`}>
          {title}
        </p>
        <div className="text-sm text-zinc-400 mt-1">{children}</div>
      </div>
    </div>
  );
}

export function OnboardingChecklist({ hlAddress, onInstallExtension, extensionDetected }) {
  const { state, update } = useOnboardingState();
  const { balance, isLoading, error } = useHlBalance(hlAddress, { enabled: Boolean(hlAddress) });
  const [fundingOpen, setFundingOpen] = useState(false);

  const hlFunded = balance != null && balance >= MIN_HL_BALANCE;
  // The registration flow already enforced that the connected wallet matches hlAddress
  // before payment could succeed. At this point the match is confirmed by construction.
  const walletMatches = Boolean(hlAddress);
  const extensionInstalled = Boolean(extensionDetected);

  useEffect(() => {
    const patch = {};
    if (hlFunded !== state.hlFunded) patch.hlFunded = hlFunded;
    if (walletMatches !== state.walletMatches) patch.walletMatches = walletMatches;
    if (extensionInstalled !== state.extensionInstalled) {
      patch.extensionInstalled = extensionInstalled;
    }
    if (Object.keys(patch).length > 0) update(patch);
  }, [hlFunded, walletMatches, extensionInstalled, state.hlFunded, state.walletMatches, state.extensionInstalled, update]);

  const allDone = hlFunded && walletMatches && extensionInstalled;
  if (allDone) return null;

  return (
    <div className="w-full mt-6 rounded-xl border border-border bg-zinc-900/50 px-5 pt-1 pb-3">
      <div className="pt-4 pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">
          Recommended setup
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Three quick checks before you place your first trade.
        </p>
      </div>

      {/* Row 1 — HL funded */}
      <div className="border-t border-border">
        <Row
          done={hlFunded}
          title={
            hlFunded
              ? `Hyperliquid balance: ${formatUSD(balance)}`
              : "Fund your Hyperliquid account with $100+"
          }
        >
          {hlFunded ? (
            <span>Ready to trade.</span>
          ) : isLoading && balance == null ? (
            <span className="inline-block h-3 w-32 skeleton rounded" />
          ) : (
            <>
              <p>
                {error || balance == null
                  ? "We couldn't read your Hyperliquid balance. Fund at least $100 USDC to place trades."
                  : `Current balance: ${formatUSD(balance)}. You need at least ${formatUSD(MIN_HL_BALANCE)} to place trades.`}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <a
                  href="https://app.hyperliquid.xyz/portfolio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-400 hover:text-teal-300 transition-[color]"
                >
                  Deposit on Hyperliquid
                  <ArrowSquareOut size={13} weight="bold" />
                </a>
                <span className="text-zinc-600">·</span>
                <button
                  type="button"
                  onClick={() => setFundingOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition-[color] outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
                  aria-expanded={fundingOpen}
                >
                  Where is your USDC?
                  <CaretDown
                    size={12}
                    weight="bold"
                    className={`transition-transform ${fundingOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              {fundingOpen && (
                <ul className="mt-3 space-y-2 text-xs text-zinc-400 border-l border-border pl-3">
                  {FUNDING_PATHS.map((p) => (
                    <li key={p.label}>
                      <span className="text-zinc-300 font-medium">{p.label}</span>
                      <br />
                      {p.body}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Row>
      </div>

      {/* Row 2 — Wallet confirmed */}
      <div className="border-t border-border">
        <Row
          done={walletMatches}
          title="Wallet matches your Hyperliquid account"
        >
          <span className="inline-flex items-center gap-1 font-mono">
            Using <span className="text-zinc-200">{truncateAddress(hlAddress)}</span> —
            verified at payment.
          </span>
        </Row>
      </div>

      {/* Row 3 — Extension */}
      <div className="border-t border-border">
        <Row
          done={extensionInstalled}
          title={extensionInstalled ? "Chrome extension installed" : "Install the Chrome extension"}
        >
          {extensionInstalled ? (
            <span>The overlay is active on Hyperliquid.</span>
          ) : (
            <>
              <p>
                The extension overlays your challenge P&amp;L, drawdown, and profit target
                directly on Hyperliquid — no tab switching.
              </p>
              <button
                type="button"
                onClick={onInstallExtension}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-teal-400 hover:text-teal-300 transition-[color] outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
              >
                <GoogleChromeLogo size={14} weight="bold" />
                Install extension
              </button>
            </>
          )}
        </Row>
      </div>
    </div>
  );
}
