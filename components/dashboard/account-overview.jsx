"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { formatUSD, formatReturn, formatPercent, pnlColor } from "@/lib/format";

function StatCard({ label, value, className }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold mt-1 ${className || ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function AccountOverview({ dashboard }) {
  const { balance, statistics, elimination } = dashboard;

  const effectiveBalance = balance?.effective_balance ?? balance?.balance;
  const allTimeReturn = statistics?.all_time_return;
  const thirtyDayReturn = statistics?.thirty_day_return;
  const winRate = statistics?.win_rate;
  const totalTrades = statistics?.total_trades;

  return (
    <div className="space-y-4">
      {elimination && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Elimination alert: {elimination.reason || "Account at risk"}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Balance"
          value={formatUSD(balance?.balance)}
        />
        <StatCard
          label="Effective Balance"
          value={formatUSD(effectiveBalance)}
        />
        <StatCard
          label="All-Time Return"
          value={allTimeReturn != null ? formatReturn(allTimeReturn) : "--"}
          className={allTimeReturn != null ? pnlColor(allTimeReturn - 1) : ""}
        />
        <StatCard
          label="30-Day Return"
          value={thirtyDayReturn != null ? formatReturn(thirtyDayReturn) : "--"}
          className={thirtyDayReturn != null ? pnlColor(thirtyDayReturn - 1) : ""}
        />
        <StatCard
          label="Win Rate"
          value={winRate != null ? formatPercent(winRate) : "--"}
        />
        <StatCard
          label="Total Trades"
          value={totalTrades != null ? totalTrades : "--"}
        />
      </div>
    </div>
  );
}
