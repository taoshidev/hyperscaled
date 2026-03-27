"use client";

import { Info } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { formatUSD, pnlColor } from "@/lib/format";
import { useHLEquity } from "@/hooks/use-hl-equity";

function StatCard({ label, value, className }) {
  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardContent className="p-4">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className={`text-lg font-semibold mt-1 font-mono ${className || ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ChallengeProgressBar({ challengePeriod, drawdown }) {
  if (!challengePeriod) return null;

  const intradayUsage = drawdown?.intraday_usage_pct ?? 0;
  const eodUsage = drawdown?.eod_usage_pct ?? 0;
  const intradayThreshold = drawdown?.intraday_threshold_pct;
  const eodThreshold = drawdown?.eod_threshold_pct;

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-zinc-500 font-medium">
          {challengePeriod.bucket === "SUBACCOUNT_FUNDED" || challengePeriod.bucket === "SUBACCOUNT_ALPHA"
            ? "Funded Account"
            : "Challenge Period"}
        </p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                Intraday Drawdown
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-sm">
                      <Info className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Drawdown from today&apos;s opening equity. Breaching this limit results in account termination.
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="font-medium">
                {intradayUsage.toFixed(1)}%
                {intradayThreshold != null ? ` / ${intradayThreshold.toFixed(0)}%` : ""}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width,background-color] ${
                  intradayUsage > 80 ? "bg-red-500" : intradayUsage > 50 ? "bg-yellow-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(intradayUsage, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                EOD Trailing Drawdown
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-sm">
                      <Info className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    End-of-day trailing drawdown from peak equity. Breaching this limit results in account termination.
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="font-medium">
                {eodUsage.toFixed(1)}%
                {eodThreshold != null ? ` / ${eodThreshold.toFixed(0)}%` : ""}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width,background-color] ${
                  eodUsage > 80 ? "bg-red-500" : eodUsage > 50 ? "bg-yellow-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(eodUsage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountOverview({ dashboard, hlAddress }) {
  const { account_size, drawdown, challenge_period, elimination, account_size_data } = dashboard;

  const intradayDDPct = drawdown?.intraday_drawdown_pct;
  const eodDDPct = drawdown?.eod_drawdown_pct;
  const intradayLimit = drawdown?.intraday_threshold_pct;
  const balance = account_size_data?.balance;

  const hlEquity = useHLEquity(hlAddress);
  const liveEquity = hlEquity.data?.accountValue ?? null;

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Account Size"
          value={formatUSD(account_size)}
        />
        <StatCard
          label="Balance"
          value={balance != null ? formatUSD(balance) : "--"}
          className={balance != null ? pnlColor(balance - account_size) : ""}
        />
        <StatCard
          label="Current Equity"
          value={
            hlEquity.isLoading
              ? "…"
              : liveEquity != null
                ? formatUSD(liveEquity)
                : "--"
          }
          className={
            liveEquity != null && account_size
              ? pnlColor(liveEquity - account_size)
              : ""
          }
        />
        <StatCard
          label="Intraday DD"
          value={intradayDDPct != null ? `${intradayDDPct.toFixed(2)}%` : "--"}
          className={intradayDDPct != null && intradayDDPct > 0 ? "text-red-400" : ""}
        />
        <StatCard
          label="EOD Trailing DD"
          value={eodDDPct != null ? `${eodDDPct.toFixed(2)}%` : "--"}
          className={eodDDPct != null && eodDDPct > 0 ? "text-red-400" : ""}
        />
        <StatCard
          label="Intraday DD Limit"
          value={intradayLimit != null ? `${intradayLimit.toFixed(1)}%` : "--"}
        />
      </div>

      <ChallengeProgressBar challengePeriod={challenge_period} drawdown={drawdown} />
    </div>
  );
}
