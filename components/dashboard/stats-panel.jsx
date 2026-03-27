"use client";

import { Info } from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatUSD, formatReturn } from "@/lib/format";

function StatRow({ label, value, tooltip }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-1">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-sm">
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="font-medium">{value ?? "--"}</span>
    </div>
  );
}

export function StatsPanel({ drawdown, challengePeriod, accountSizeData, limits }) {
  const hasData = drawdown || challengePeriod || accountSizeData || limits;

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-zinc-500">
            No statistics available
          </p>
        ) : (
          <div className="space-y-4">
            {(challengePeriod || accountSizeData) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Account
                </p>
                {challengePeriod && (
                  <StatRow
                    label="Status"
                    value={challengePeriod.bucket?.replace(/_/g, " ") || "--"}
                  />
                )}
                <StatRow
                  label="Current Equity"
                  value={
                    drawdown?.current_equity != null
                      ? formatReturn(drawdown.current_equity)
                      : undefined
                  }
                />
                {accountSizeData && (
                  <>
                    <StatRow
                      label="Balance"
                      value={
                        accountSizeData.balance != null
                          ? formatUSD(accountSizeData.balance)
                          : undefined
                      }
                    />
                    <StatRow
                      label="Buying Power"
                      value={
                        accountSizeData.buying_power != null
                          ? formatUSD(accountSizeData.buying_power)
                          : undefined
                      }
                    />
                    <StatRow
                      label="Max Return"
                      tooltip="High-water mark of portfolio return."
                      value={
                        accountSizeData.max_return != null
                          ? formatReturn(accountSizeData.max_return)
                          : undefined
                      }
                    />
                  </>
                )}
              </div>
            )}

            {drawdown && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Drawdown
                </p>
                <StatRow
                  label="Intraday Drawdown"
                  tooltip="Drawdown from today's opening equity. Breaching the limit results in account termination."
                  value={
                    drawdown.intraday_drawdown_pct != null
                      ? `${drawdown.intraday_drawdown_pct.toFixed(2)}%`
                      : undefined
                  }
                />
                <StatRow
                  label="EOD Trailing Drawdown"
                  tooltip="End-of-day drawdown from peak equity high-water mark."
                  value={
                    drawdown.eod_drawdown_pct != null
                      ? `${drawdown.eod_drawdown_pct.toFixed(2)}%`
                      : undefined
                  }
                />
                <StatRow
                  label="Intraday Usage"
                  tooltip={
                    <div className="space-y-1.5">
                      <p className="font-medium">Intraday Drawdown Rule</p>
                      <p>Daily drawdown must not exceed the intraday threshold from starting daily equity.</p>
                      <p className="text-muted-foreground">Breaching this rule results in account termination.</p>
                    </div>
                  }
                  value={
                    drawdown.intraday_usage_pct != null
                      ? `${drawdown.intraday_usage_pct.toFixed(1)}%${
                          drawdown.intraday_threshold_pct != null
                            ? ` / ${drawdown.intraday_threshold_pct.toFixed(0)}%`
                            : ""
                        }`
                      : undefined
                  }
                />
                <StatRow
                  label="EOD Usage"
                  tooltip={
                    <div className="space-y-1.5">
                      <p className="font-medium">EOD Trailing Drawdown Rule</p>
                      <p>End-of-day equity must not fall below the trailing threshold from peak EOD equity.</p>
                      <p className="text-muted-foreground">Breaching this rule results in account termination.</p>
                    </div>
                  }
                  value={
                    drawdown.eod_usage_pct != null
                      ? `${drawdown.eod_usage_pct.toFixed(1)}%${
                          drawdown.eod_threshold_pct != null
                            ? ` / ${drawdown.eod_threshold_pct.toFixed(0)}%`
                            : ""
                        }`
                      : undefined
                  }
                />
              </div>
            )}

            {limits && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Trading Limits
                </p>
                <StatRow
                  label="Max Per Pair"
                  value={
                    limits.max_position_per_pair_usd != null
                      ? formatUSD(limits.max_position_per_pair_usd)
                      : undefined
                  }
                />
                <StatRow
                  label="Max Portfolio"
                  value={
                    limits.max_portfolio_usd != null
                      ? formatUSD(limits.max_portfolio_usd)
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
