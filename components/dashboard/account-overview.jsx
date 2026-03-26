"use client";

import { Info } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { formatUSD, formatReturn, pnlColor } from "@/lib/format";

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

function ChallengeProgressBar({ challengeProgress }) {
  if (!challengeProgress?.in_challenge_period) return null;

  const completion = challengeProgress.challenge_completion_percent ?? 0;
  const drawdownUsage = challengeProgress.drawdown_usage_percent ?? 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium">
          Challenge Period
        </p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completion.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-[width]"
                style={{ width: `${Math.min(completion, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                Drawdown Usage
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-sm">
                      <Info className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="space-y-1.5">
                      <p className="font-medium">2-Step Drawdown Rules</p>
                      <p>1. Daily drawdown must not exceed 4% of starting daily equity.</p>
                      <p>2. Total drawdown must not exceed the account drawdown limit from peak equity.</p>
                      <p className="text-muted-foreground">Breaching either rule results in account termination.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="font-medium">
                {drawdownUsage.toFixed(1)}%
                {challengeProgress.drawdown_limit_percent != null
                  ? ` / ${challengeProgress.drawdown_limit_percent.toFixed(0)}%`
                  : ""}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width,background-color] ${
                  drawdownUsage > 80 ? "bg-red-500" : drawdownUsage > 50 ? "bg-yellow-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(drawdownUsage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountOverview({ dashboard }) {
  const { account_size, drawdown, challenge_progress, elimination } = dashboard;

  const currentReturn = challenge_progress?.current_return;
  const drawdownPct = challenge_progress?.drawdown_percent;
  const maxDrawdown = drawdown?.ledger_max_drawdown;
  const challengeCompletion = challenge_progress?.challenge_completion_percent;
  const drawdownLimit = challenge_progress?.drawdown_limit_percent;

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
          label="Account Size"
          value={formatUSD(account_size)}
        />
        <StatCard
          label="Current Return"
          value={currentReturn != null ? formatReturn(currentReturn) : "--"}
          className={currentReturn != null ? pnlColor(currentReturn - 1) : ""}
        />
        <StatCard
          label="Drawdown"
          value={drawdownPct != null ? `${drawdownPct.toFixed(2)}%` : "--"}
          className={drawdownPct != null ? "text-red-400" : ""}
        />
        <StatCard
          label="Max Drawdown"
          value={maxDrawdown != null ? `${((1 - maxDrawdown) * 100).toFixed(2)}%` : "--"}
          className={maxDrawdown != null ? "text-red-400" : ""}
        />
        <StatCard
          label="Challenge Progress"
          value={challengeCompletion != null ? `${challengeCompletion.toFixed(1)}%` : "--"}
        />
        <StatCard
          label="Drawdown Limit"
          value={drawdownLimit != null ? `${drawdownLimit.toFixed(1)}%` : "--"}
        />
      </div>

      <ChallengeProgressBar challengeProgress={challenge_progress} />
    </div>
  );
}
