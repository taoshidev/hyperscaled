"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatUSD } from "@/lib/format";

export function ChallengeProgress({ accountSize, accountSizeData, drawdown, challengePeriod }) {
  if (!challengePeriod || !drawdown) return null;

  const isFunded =
    challengePeriod.bucket === "SUBACCOUNT_FUNDED" ||
    challengePeriod.bucket === "SUBACCOUNT_ALPHA";

  const profitTarget = accountSize * 0.1;
  const totalPnl = accountSizeData?.total_realized_pnl ?? 0;
  const profitPct = profitTarget > 0 ? Math.max(0, (totalPnl / profitTarget) * 100) : 0;

  const intradayDD = drawdown.intraday_drawdown_pct ?? 0;
  const intradayThreshold = drawdown.intraday_threshold_pct ?? 5;
  const intradayUsage = drawdown.intraday_usage_pct ?? 0;
  const intradayMaxLoss = accountSize * (intradayThreshold / 100);
  const intradayRemaining = intradayMaxLoss - accountSize * (intradayDD / 100);

  const eodDD = drawdown.eod_drawdown_pct ?? 0;
  const eodThreshold = drawdown.eod_threshold_pct ?? 8;
  const eodUsage = drawdown.eod_usage_pct ?? 0;
  const eodHwm = drawdown.eod_hwm ?? drawdown.current_equity ?? 1;
  const eodMaxLoss = accountSize * (eodThreshold / 100);
  const eodRemaining = eodMaxLoss - accountSize * (eodDD / 100);

  const leverageLabel = isFunded ? "5x" : "1.25x";

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardContent className="p-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">
          {isFunded ? "Funded Account" : "Evaluation Progress"}
        </p>

        <div className="bg-white/[0.015] border border-white/[0.06] rounded-lg p-6">
          {/* Header row */}
          <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
            <h3 className="text-sm text-zinc-400">Account Progress</h3>
            <div className="flex gap-4 text-xs text-zinc-500">
              <span>
                Max Leverage:{" "}
                <strong className="text-zinc-300 font-medium">{leverageLabel}</strong>
              </span>
              <span>
                Daily DD Limit:{" "}
                <strong className="text-zinc-300 font-medium">{intradayThreshold.toFixed(0)}%</strong>
              </span>
              <span>
                Trailing DD Limit:{" "}
                <strong className="text-zinc-300 font-medium">{eodThreshold.toFixed(0)}% HWM</strong>
              </span>
            </div>
          </div>

          {/* Four-column progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-5">
            {/* Profit Target */}
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Profit Target</span>
                <span>10%</span>
              </div>
              <div className="text-xl font-light tracking-tight text-green-400 mb-2">
                {formatUSD(totalPnl)}{" "}
                <span className="text-sm text-zinc-500">/ {formatUSD(profitTarget)}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-[width]"
                  style={{ width: `${Math.min(100, profitPct)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {profitPct.toFixed(1)}% of target
              </p>
            </div>

            {/* Daily Drawdown */}
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Daily Drawdown</span>
                <span>{intradayThreshold.toFixed(0)}% limit</span>
              </div>
              <div className="text-xl font-light tracking-tight mb-2">
                {intradayDD.toFixed(2)}%{" "}
                <span className="text-sm text-zinc-500">/ {intradayThreshold.toFixed(2)}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] ${
                    intradayUsage > 80 ? "bg-red-500" : intradayUsage > 50 ? "bg-yellow-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, intradayUsage)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {formatUSD(Math.max(0, intradayRemaining))} / {formatUSD(intradayMaxLoss)} max loss
              </p>
            </div>

            {/* Trailing Drawdown */}
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Trailing Drawdown</span>
                <span>HWM: {(eodHwm * 100).toFixed(1)}%</span>
              </div>
              <div className="text-xl font-light tracking-tight mb-2">
                {eodDD.toFixed(2)}%{" "}
                <span className="text-sm text-zinc-500">/ {eodThreshold.toFixed(2)}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] ${
                    eodUsage > 80 ? "bg-red-500" : eodUsage > 50 ? "bg-yellow-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, eodUsage)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {formatUSD(Math.max(0, eodRemaining))} / {formatUSD(eodMaxLoss)} max loss
              </p>
            </div>

            {/* Days Remaining */}
            <div>
              <div className="text-xs text-zinc-500 mb-1">Days Remaining</div>
              <div className="text-xl font-light tracking-tight mb-2">&infin;</div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="w-full h-full rounded-full bg-blue-500" />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Unlimited trading period
              </p>
            </div>
          </div>

          {/* Overall challenge completion bar */}
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>Challenge Completion</span>
            <span>{profitPct.toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${Math.min(100, profitPct)}%`,
                background: "linear-gradient(90deg, #3b82f6, #22c55e)",
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
