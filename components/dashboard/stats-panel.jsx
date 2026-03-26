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

export function StatsPanel({ drawdown, challengeProgress, limits }) {
  const hasData = drawdown || challengeProgress || limits;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">
            No statistics available
          </p>
        ) : (
          <div className="space-y-4">
            {challengeProgress && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Challenge
                </p>
                <StatRow
                  label="Current Return"
                  value={
                    challengeProgress.current_return != null
                      ? formatReturn(challengeProgress.current_return)
                      : undefined
                  }
                />
                <StatRow
                  label="Target Return"
                  value={
                    challengeProgress.target_return_percent != null
                      ? `${challengeProgress.target_return_percent}%`
                      : undefined
                  }
                />
                <StatRow
                  label="Returns Progress"
                  value={
                    challengeProgress.returns_progress_percent != null
                      ? `${challengeProgress.returns_progress_percent.toFixed(1)}%`
                      : undefined
                  }
                />
                <StatRow
                  label="Time Progress"
                  value={
                    challengeProgress.time_progress_percent != null
                      ? `${challengeProgress.time_progress_percent.toFixed(1)}%`
                      : undefined
                  }
                />
              </div>
            )}

            {(drawdown || challengeProgress) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Drawdown
                </p>
                <StatRow
                  label="Current Drawdown"
                  tooltip="Your current drawdown from peak equity. Exceeding the limit results in account breach."
                  value={
                    challengeProgress?.drawdown_percent != null
                      ? `${challengeProgress.drawdown_percent.toFixed(2)}%`
                      : undefined
                  }
                />
                <StatRow
                  label="Max Drawdown"
                  tooltip="The highest drawdown recorded on this account since inception."
                  value={
                    drawdown?.ledger_max_drawdown != null
                      ? `${((1 - drawdown.ledger_max_drawdown) * 100).toFixed(2)}%`
                      : challengeProgress?.max_drawdown_percent != null
                        ? `${challengeProgress.max_drawdown_percent.toFixed(2)}%`
                        : challengeProgress?.drawdown_percent != null
                          ? `${challengeProgress.drawdown_percent.toFixed(2)}%`
                          : undefined
                  }
                />
                <StatRow
                  label="Drawdown Usage"
                  tooltip={
                    <div className="space-y-1.5">
                      <p className="font-medium">2-Step Drawdown Rules</p>
                      <p>1. Daily drawdown must not exceed 4% of starting daily equity.</p>
                      <p>2. Total drawdown must not exceed the account drawdown limit from peak equity.</p>
                      <p className="text-muted-foreground">Breaching either rule results in account termination.</p>
                    </div>
                  }
                  value={
                    challengeProgress?.drawdown_usage_percent != null
                      ? `${challengeProgress.drawdown_usage_percent.toFixed(1)}%${
                          challengeProgress.drawdown_limit_percent != null
                            ? ` / ${challengeProgress.drawdown_limit_percent.toFixed(0)}%`
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
