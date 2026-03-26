"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useDashboardData } from "@/hooks/use-dashboard";
import { useDashboardStream } from "@/hooks/use-dashboard-stream";
import { ConnectionStatus } from "./connection-status";
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

  const activeAddress = isConnected ? address : lookupSubmitted ? lookupAddr.trim() : null;

  const { dashboard, events } = useDashboardData(activeAddress);
  const { status: streamStatus } = useDashboardStream(
    activeAddress && dashboard.data ? activeAddress : null,
  );

  // Disconnected — show connect + address lookup
  if (!isConnected && !lookupSubmitted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <div className="space-y-8 max-w-md w-full mx-auto text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Trading Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Connect your wallet to view your trading dashboard.
            </p>
          </div>
          <div className="flex justify-center">
            <ConnectButton />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-zinc-500">or look up an address</span>
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
                className="w-full h-11 pl-9 pr-3 rounded-lg bg-zinc-900/60 border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background font-mono transition-[border-color,box-shadow]"
              />
            </div>
            <Button type="submit" className="h-11 px-5" disabled={!lookupAddr.trim()}>
              Look up
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Loading
  if (dashboard.isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 mx-auto text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error: 404
  if (dashboard.error?.status === 404) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <div className="space-y-4 max-w-md w-full mx-auto text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-500" />
          <h2 className="text-xl font-bold">No Account Found</h2>
          <p className="text-sm text-muted-foreground">
            This wallet is not registered with any entity miner.
          </p>
          <Link href="/register">
            <Button className="mt-2">Register Now</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error: 502 or other
  if (dashboard.error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <div className="space-y-4 max-w-md w-full mx-auto text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <h2 className="text-xl font-bold">
            {dashboard.error.status === 502
              ? "Gateway Offline"
              : "Something Went Wrong"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {dashboard.error.status === 502
              ? "The trading gateway is currently unreachable. Please try again later."
              : "Could not load dashboard data. Please try again."}
          </p>
          <Button
            variant="outline"
            onClick={() => dashboard.refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
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
    <div className="min-h-[100dvh] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Trading Dashboard</h1>
            <ConnectionStatus status={streamStatus} />
          </div>
          <ConnectButton />
        </div>

        {/* KYC Verification */}
        <KycVerification wallet={address} />

        {/* Account Overview */}
        <AccountOverview dashboard={data} />

        {/* Open Positions */}
        <OpenPositions positions={data.positions} />

        {/* Trade History */}
        <TradeHistory positions={data.positions} />

        {/* Order Events + Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrderEvents events={eventsData} />
          <StatsPanel
            drawdown={data.drawdown}
            challengeProgress={data.challenge_progress}
            limits={data.limits}
          />
        </div>
      </div>
    </div>
  );
}
