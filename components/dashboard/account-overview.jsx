"use client";

import { Info } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { formatUSD, formatReturn, pnlColor } from "@/lib/format";

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
  const intradayDD = drawdown?.intraday_drawdown_pct;
  const eodDD = drawdown?.eod_drawdown_pct;

  const intradaySummary =
    intradayDD != null && intradayThreshold != null
      ? `${intradayDD.toFixed(2)}% of ${intradayThreshold.toFixed(1)}% max`
      : intradayDD != null
        ? `${intradayDD.toFixed(2)}%`
        : "—";
  const eodSummary =
    eodDD != null && eodThreshold != null
      ? `${eodDD.toFixed(2)}% of ${eodThreshold.toFixed(1)}% max`
      : eodDD != null
        ? `${eodDD.toFixed(2)}%`
        : "—";

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium">
          {challengePeriod.bucket === "SUBACCOUNT_FUNDED" || challengePeriod.bucket === "SUBACCOUNT_ALPHA"
            ? "Funded Account"
            : "Challenge Period"}
        </p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-start gap-2 text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                Intraday drawdown
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-sm">
                      <Info className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium mb-1">From today&apos;s opening equity</p>
                    <p className="text-muted-foreground">
                      The figure on the right is your current drawdown versus the maximum allowed. The bar fills toward
                      100% as you use that allowance (same meaning as Intraday limit usage in Statistics).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="font-medium font-mono text-right leading-tight">{intradaySummary}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width,background-color] ${
                  intradayUsage > 80 ? "bg-red-500" : intradayUsage > 50 ? "bg-yellow-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(intradayUsage, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Limit usage: {intradayUsage.toFixed(1)}% · bar reaches 100% at breach
            </p>
          </div>
          <div>
            <div className="flex justify-between items-start gap-2 text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                EOD trailing drawdown
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-sm">
                      <Info className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium mb-1">From peak equity (high-water mark)</p>
                    <p className="text-muted-foreground">
                      The figure on the right is current trailing drawdown versus the maximum allowed. The bar is your
                      share of that EOD allowance (same meaning as EOD limit usage in Statistics).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="font-medium font-mono text-right leading-tight">{eodSummary}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width,background-color] ${
                  eodUsage > 80 ? "bg-red-500" : eodUsage > 50 ? "bg-yellow-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(eodUsage, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Limit usage: {eodUsage.toFixed(1)}% · bar reaches 100% at breach
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountOverview({ dashboard }) {
  const { account_size, drawdown, challenge_period, elimination, account_size_data } = dashboard;

  const currentEquity = drawdown?.current_equity;
  const intradayDDPct = drawdown?.intraday_drawdown_pct;
  const eodDDPct = drawdown?.eod_drawdown_pct;
  const intradayLimit = drawdown?.intraday_threshold_pct;
  const balance = account_size_data?.balance;

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
          value={currentEquity != null ? formatReturn(currentEquity) : "--"}
          className={currentEquity != null ? pnlColor(currentEquity - 1) : ""}
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
