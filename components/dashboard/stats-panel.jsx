"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatUSD, formatPercent, formatReturn } from "@/lib/format";

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
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
                  value={
                    challengeProgress?.drawdown_percent != null
                      ? `${challengeProgress.drawdown_percent.toFixed(2)}%`
                      : undefined
                  }
                />
                <StatRow
                  label="Max Drawdown"
                  value={
                    drawdown?.ledger_max_drawdown != null
                      ? `${((1 - drawdown.ledger_max_drawdown) * 100).toFixed(2)}%`
                      : undefined
                  }
                />
                <StatRow
                  label="Drawdown Usage"
                  value={
                    challengeProgress?.drawdown_usage_percent != null
                      ? `${challengeProgress.drawdown_usage_percent.toFixed(1)}%`
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
