"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertCircle, RefreshCw } from "lucide-react";
import { MagnifyingGlass, Wallet, ArrowRight, Warning, WifiSlash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useDashboardData } from "@/hooks/use-dashboard";
import { useDashboardStream } from "@/hooks/use-dashboard-stream";
import { AccountOverview } from "./account-overview";
import { OpenPositions } from "./open-positions";
import { TradeHistory } from "./trade-history";

import { OrderEvents } from "./order-events";
import { StatsPanel } from "./stats-panel";
import { KycVerification } from "./kyc-verification";

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const [lookupAddr, setLookupAddr] = useState("");
  const [lookupSubmitted, setLookupSubmitted] = useState(false);
  const [useConnectedWallet, setUseConnectedWallet] = useState(false);

  // User must explicitly choose — connected wallet or lookup
  const activeAddress =
    useConnectedWallet && isConnected
      ? address
      : lookupSubmitted
        ? lookupAddr.trim()
        : null;

  const { dashboard, events } = useDashboardData(activeAddress);
  useDashboardStream(
    activeAddress && dashboard.data ? activeAddress : null,
  );

  const handleReset = () => {
    setUseConnectedWallet(false);
    setLookupSubmitted(false);
    setLookupAddr("");
  };

  // No choice made yet — show options
  if (!useConnectedWallet && !lookupSubmitted) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-6">
        <div className="space-y-8 max-w-md w-full mx-auto text-center">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-teal" />
              <span className="text-xs text-teal-400 font-medium uppercase tracking-widest">Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Trading Dashboard</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {isConnected
                ? "Use your connected wallet or look up any address."
                : "Connect your wallet to view your trading dashboard."}
            </p>
          </div>

          {isConnected ? (
            <button
              onClick={() => setUseConnectedWallet(true)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-900/70 border border-white/[0.08] hover:border-teal-400/40 hover:bg-zinc-900/90 text-left transition-[border-color,box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-400/10">
                <Wallet size={20} weight="duotone" className="text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Use connected wallet</p>
                <p className="text-xs text-zinc-500 font-mono truncate">{address}</p>
              </div>
              <ArrowRight size={16} className="text-zinc-500" />
            </button>
          ) : (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-[#09090b] px-3 text-zinc-500">or look up an address</span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (lookupAddr.trim()) setLookupSubmitted(true);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                type="text"
                value={lookupAddr}
                onChange={(e) => setLookupAddr(e.target.value)}
                placeholder="Enter HL wallet address\u2026"
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-zinc-900/70 border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background font-mono transition-[border-color,box-shadow]"
              />
            </div>
            <Button type="submit" className="h-11 px-5 rounded-xl" disabled={!lookupAddr.trim()}>
              Look up
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Loading — skeleton instead of spinner
  if (dashboard.isLoading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] px-6 py-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-7 w-48" />
            </div>
            <div className="skeleton h-9 w-32 rounded-lg" />
          </div>
          {/* Stat cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.08] bg-zinc-900/70 p-4 space-y-2">
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-6 w-24" />
              </div>
            ))}
          </div>
          {/* Progress bar skeleton */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/70 p-4 space-y-3">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-2 w-full rounded-full" />
            <div className="skeleton h-2 w-full rounded-full" />
          </div>
          {/* Table skeleton */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/70 p-4 space-y-3">
            <div className="skeleton h-4 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-8 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error: 404
  if (dashboard.error?.status === 404) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-6">
        <div className="space-y-5 max-w-md w-full mx-auto text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Warning size={32} weight="duotone" className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">No Account Found</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This wallet is not registered with any entity miner.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <span className="shiny-cta px-6 py-3 inline-flex items-center gap-1.5">
                <span className="flex items-center gap-1.5">
                  Register Now
                  <ArrowRight size={15} weight="bold" />
                </span>
              </span>
            </Link>
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-white/[0.12] hover:border-white/[0.24] hover:bg-white/[0.04]"
            >
              Try another address
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error: 502 or other
  if (dashboard.error) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-6">
        <div className="space-y-5 max-w-md w-full mx-auto text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20">
            {dashboard.error.status === 502 ? (
              <WifiSlash size={32} weight="duotone" className="text-red-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-400" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {dashboard.error.status === 502
              ? "Gateway Offline"
              : "Something Went Wrong"}
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {dashboard.error.status === 502
              ? "The trading gateway is currently unreachable. Please try again later."
              : "Could not load dashboard data. Please try again."}
          </p>
          <Button
            variant="outline"
            onClick={() => dashboard.refetch()}
            className="border-white/[0.12] hover:border-white/[0.24] hover:bg-white/[0.04] gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Loaded
  const data = dashboard.data;
  const eventsData = events.data;

  return (
    <div className="min-h-[calc(100dvh-4rem)] px-6 py-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-teal" />
                <span className="text-xs text-teal-400 font-medium uppercase tracking-widest">Live</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Trading Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2 text-xs border-white/[0.12] hover:border-white/[0.24] hover:bg-white/[0.04]"
            >
              <MagnifyingGlass size={14} weight="bold" />
              Switch wallet
            </Button>
            {isConnected && <ConnectButton />}
          </div>
        </div>

        {/* KYC Verification */}
        <KycVerification wallet={address} />

        {/* Account Overview */}
        <AccountOverview
          dashboard={data}
          hlAddress={data.hl_address}
        />

        {/* Open Positions */}
        <OpenPositions positions={data.positions} />

        {/* Trade History */}
        <TradeHistory positions={data.positions} />

        {/* Order Events + Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrderEvents events={eventsData} />
          <StatsPanel
            drawdown={data.drawdown}
            challengePeriod={data.challenge_period}
            accountSizeData={data.account_size_data}
            limits={data.limits}
          />
        </div>
      </div>
    </div>
  );
}
