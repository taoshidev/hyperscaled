"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatUSD, pnlColor } from "@/lib/format";
import { openPositionsUnrealizedTotalUsd } from "@/lib/position-utils";

function StatCard({ label, value, sub, className }) {
  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardContent className="p-4">
        <p className="text-xs text-zinc-500 mb-1 flex justify-between items-center">
          {label}
          {sub && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${sub.className || "bg-white/[0.06] text-zinc-400"}`}>
              {sub.text}
            </span>
          )}
        </p>
        <p className={`text-2xl font-light tracking-tight font-mono ${className || ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function AccountOverview({ dashboard }) {
  const { account_size, elimination, account_size_data, positions, challenge_period } = dashboard;

  const isFunded =
    challenge_period?.bucket === "SUBACCOUNT_FUNDED" ||
    challenge_period?.bucket === "SUBACCOUNT_ALPHA";

  const balance = account_size_data?.balance;
  const profitTarget = account_size * 0.1;
  const totalPnl = account_size_data?.total_realized_pnl ?? 0;
  const openPnl = openPositionsUnrealizedTotalUsd(positions, account_size_data);

  const balanceChange = balance != null ? ((balance - account_size) / account_size * 100) : null;

  return (
    <div className="space-y-4">
      {elimination && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Elimination alert: {elimination.reason || "Account at risk"}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Balance"
          value={balance != null ? formatUSD(balance) : "--"}
          sub={balanceChange != null ? {
            text: `${balanceChange >= 0 ? "+" : ""}${balanceChange.toFixed(2)}%`,
            className: balanceChange >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400",
          } : undefined}
          className={balance != null ? pnlColor(balance - account_size) : ""}
        />
        {isFunded ? (
          <StatCard
            label="Closed PnL"
            value={formatUSD(totalPnl)}
            className={pnlColor(totalPnl)}
          />
        ) : (
          <StatCard
            label="Profit Target"
            value={formatUSD(totalPnl)}
            sub={{ text: formatUSD(profitTarget), className: "bg-blue-500/[0.12] text-blue-400" }}
            className={pnlColor(totalPnl)}
          />
        )}
        <StatCard
          label="Open PnL"
          value={openPnl != null ? `${openPnl >= 0 ? "+" : ""}${formatUSD(openPnl)}` : "--"}
          className={openPnl != null ? pnlColor(openPnl) : ""}
        />
      </div>
    </div>
  );
}
