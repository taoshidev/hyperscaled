"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Circle,
  X,
  ArrowSquareOut,
  GoogleChromeLogo,
} from "@phosphor-icons/react";
import { useHlBalance } from "@/hooks/use-hl-balance";
import { useOnboardingState } from "@/hooks/use-onboarding-state";
import { useExtensionBridge } from "@/hooks/use-extension-bridge";
import ExtensionModal from "@/components/marketing/ExtensionModal";

const MIN_HL_BALANCE = 100;

function Item({ done, children }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {done ? (
        <CheckCircle size={16} weight="fill" className="text-teal-400 shrink-0" />
      ) : (
        <Circle size={16} weight="duotone" className="text-zinc-600 shrink-0" />
      )}
      <span
        className={`text-xs sm:text-sm truncate ${
          done ? "text-teal-400" : "text-zinc-300"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

export function SetupChecklist({ dashboard, events, watchedAddress, canReadHlBalance }) {
  const { state, update, dismiss, isSnoozed } = useOnboardingState();
  const { balance } = useHlBalance(watchedAddress, {
    enabled: canReadHlBalance,
  });
  const { extensionDetected } = useExtensionBridge();
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);

  const positionsArr = Array.isArray(dashboard?.positions?.positions)
    ? dashboard.positions.positions
    : [];
  const eventsArr = Array.isArray(events) ? events : [];
  const hasFirstTrade = positionsArr.length > 0 || eventsArr.length > 0;

  const hlFunded = canReadHlBalance && balance != null && balance >= MIN_HL_BALANCE;
  const extensionInstalled = Boolean(extensionDetected);

  useEffect(() => {
    const patch = {};
    if (canReadHlBalance && hlFunded !== state.hlFunded) {
      patch.hlFunded = hlFunded;
    }
    if (extensionInstalled !== state.extensionInstalled) {
      patch.extensionInstalled = extensionInstalled;
    }
    if (hasFirstTrade && !state.firstTradeAt) {
      patch.firstTradeAt = new Date().toISOString();
    }
    if (Object.keys(patch).length > 0) update(patch);
  }, [canReadHlBalance, hlFunded, extensionInstalled, hasFirstTrade, state.hlFunded, state.extensionInstalled, state.firstTradeAt, update]);

  const firstTradeDone = Boolean(state.firstTradeAt) || hasFirstTrade;
  // If we can't auto-detect HL balance (lookup mode), treat the stored value as authoritative.
  const fundedDone = canReadHlBalance ? hlFunded : Boolean(state.hlFunded);

  const allDone = fundedDone && extensionInstalled && firstTradeDone;
  if (allDone || isSnoozed || state.completedAt) return null;

  const handleInstall = () => {
    const a = document.createElement("a");
    a.href = "/hyperscaled_extension.zip";
    a.download = "hyperscaled_extension.zip";
    a.click();
    setExtensionModalOpen(true);
  };

  return (
    <div className="rounded-xl border border-teal-400/20 bg-teal-400/[0.04] px-4 py-3">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-400">
            Finish setup
          </p>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">
            <Item done={fundedDone}>
              {fundedDone
                ? "Hyperliquid funded"
                : canReadHlBalance
                  ? "Fund Hyperliquid with $100+"
                  : "Connect wallet to verify HL balance"}
            </Item>
            <Item done={extensionInstalled}>
              {extensionInstalled ? "Extension installed" : "Install Chrome extension"}
            </Item>
            <Item done={firstTradeDone}>
              {firstTradeDone ? "First trade placed" : "Place your first trade"}
            </Item>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!fundedDone && canReadHlBalance && (
            <a
              href="https://app.hyperliquid.xyz/portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300 px-2 py-1 rounded transition-[color]"
            >
              Deposit <ArrowSquareOut size={11} weight="bold" />
            </a>
          )}
          {!extensionInstalled && (
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300 px-2 py-1 rounded transition-[color] outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <GoogleChromeLogo size={12} weight="bold" />
              Install
            </button>
          )}
          {!firstTradeDone && (fundedDone || !canReadHlBalance) && (
            <a
              href="https://app.hyperliquid.xyz/trade"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300 px-2 py-1 rounded transition-[color]"
            >
              Trade <ArrowSquareOut size={11} weight="bold" />
            </a>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Remind me later"
            title="Remind me later"
            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-[color] rounded outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      </div>

      <ExtensionModal
        open={extensionModalOpen}
        onClose={() => setExtensionModalOpen(false)}
      />
    </div>
  );
}
