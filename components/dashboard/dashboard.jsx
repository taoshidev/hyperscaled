"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { useDashboardData } from "@/hooks/use-dashboard";
import { useDashboardStream } from "@/hooks/use-dashboard-stream";
import { ConnectionStatus } from "./connection-status";
import { AccountOverview } from "./account-overview";
import { OpenPositions } from "./open-positions";
import { TradeHistory } from "./trade-history";
import { PendingOrders } from "./pending-orders";
import { OrderEvents } from "./order-events";
import { StatsPanel } from "./stats-panel";
import { KycVerification } from "./kyc-verification";

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const { dashboard, events } = useDashboardData(
    isConnected ? address : null,
  );
  const { status: streamStatus } = useDashboardStream(
    isConnected && dashboard.data ? address : null,
  );

  // Disconnected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="space-y-6 max-w-md w-full mx-auto text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Trading Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Connect your wallet to view your trading dashboard.
            </p>
          </div>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (dashboard.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
      <div className="min-h-screen flex items-center justify-center p-4">
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
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
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

        {/* Open Positions + Pending Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OpenPositions positions={data.positions} />
          <PendingOrders limitOrders={data.limit_orders} />
        </div>

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
