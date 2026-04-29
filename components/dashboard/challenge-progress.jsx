"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatUSD } from "@/lib/format";

export function ChallengeProgress({ accountSize, accountSizeData, drawdown, challengePeriod, statistics, quarterlyPnl: rawQuarterlyPnl, limits }) {
  if (!challengePeriod || !drawdown) return null;

  const isFunded =
    challengePeriod.bucket === "SUBACCOUNT_FUNDED" ||
    challengePeriod.bucket === "SUBACCOUNT_ALPHA";

  const profitTarget = accountSize * 0.1;
  // Use total_realized_pnl to match the leaderboard; fall back to balance delta
  // if the field is absent (older API responses).
  const totalPnl = accountSizeData?.total_realized_pnl != null
    ? accountSizeData.total_realized_pnl
    : (accountSizeData?.balance != null && accountSizeData?.account_size != null)
      ? accountSizeData.balance - accountSizeData.account_size
      : 0;
  const profitPct = profitTarget > 0 ? Math.max(0, (totalPnl / profitTarget) * 100) : 0;

  const intradayDD = Math.max(0, drawdown.intraday_drawdown_pct ?? 0);
  const intradayThreshold = drawdown.intraday_threshold_pct ?? 5;
  const intradayUsage = Math.max(0, drawdown.intraday_usage_pct ?? 0);
  const intradayMaxLoss = accountSize * (intradayThreshold / 100);
  const intradayRemaining = intradayMaxLoss - accountSize * (intradayDD / 100);

  const eodDD = Math.max(0, drawdown.eod_drawdown_pct ?? 0);
  const eodThreshold = drawdown.eod_threshold_pct ?? 8;
  const eodUsage = Math.max(0, drawdown.eod_usage_pct ?? 0);
  const eodHwm = drawdown.eod_hwm ?? drawdown.current_equity ?? 1;
  const eodMaxLoss = accountSize * (eodThreshold / 100);
  const eodRemaining = eodMaxLoss - accountSize * (eodDD / 100);

  const portfolioMultiplier = limits?.max_portfolio_usd != null && accountSize > 0
    ? limits.max_portfolio_usd / accountSize
    : isFunded ? 5 : 1.25;
  const leverageLabel = `${portfolioMultiplier % 1 === 0 ? portfolioMultiplier.toFixed(0) : portfolioMultiplier.toFixed(2)}x`;

  if (isFunded) {
    return <FundedProgress
      totalPnl={totalPnl}
      intradayDD={intradayDD}
      intradayThreshold={intradayThreshold}
      intradayUsage={intradayUsage}
      intradayMaxLoss={intradayMaxLoss}
      intradayRemaining={intradayRemaining}
      eodDD={eodDD}
      eodThreshold={eodThreshold}
      eodUsage={eodUsage}
      eodHwm={eodHwm}
      eodMaxLoss={eodMaxLoss}
      eodRemaining={eodRemaining}
      leverageLabel={leverageLabel}
      statistics={statistics}
      quarterlyPnlPct={rawQuarterlyPnl != null && accountSize > 0 ? (rawQuarterlyPnl / accountSize) * 100 : null}
    />;
  }

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardContent className="p-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">
          Evaluation Progress
        </p>

        <div className="bg-white/[0.015] border border-white/[0.06] rounded-lg p-6">
          {/* Header row */}
          <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
            <h3 className="text-sm text-zinc-400">Account Progress</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>
                Portfolio Size:{" "}
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

            <div>
              <div className="text-xs text-zinc-500 mb-1">Challenge Window</div>
              <div className="text-xl font-light tracking-tight mb-2">&infin;</div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="w-full h-full rounded-full bg-teal-500" />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Unlimited time to complete the challenge</p>
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

function FundedProgress({
  totalPnl,
  intradayDD,
  intradayThreshold,
  intradayUsage,
  intradayMaxLoss,
  intradayRemaining,
  eodDD,
  eodThreshold,
  eodUsage,
  eodHwm,
  eodMaxLoss,
  eodRemaining,
  leverageLabel,
  statistics,
  quarterlyPnlPct,
}) {
  const rawSharpe = statistics?.sharpe ?? null;
  // -100 is a sentinel value meaning insufficient data (< 60 days)
  const sharpeInsufficient = rawSharpe === -100;
  const sharpeRatio = rawSharpe != null && !sharpeInsufficient ? rawSharpe : null;
  const sharpeTarget = 1.0;
  const sharpePct = sharpeRatio != null ? Math.min(100, (sharpeRatio / sharpeTarget) * 100) : 0;

  const quarterlyTarget = 5;
  const quarterlyPct = quarterlyPnlPct != null ? Math.min(100, Math.max(0, (quarterlyPnlPct / quarterlyTarget) * 100)) : 0;

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardContent className="p-6">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">
          Funded Account
        </p>

        <div className="bg-white/[0.015] border border-white/[0.06] rounded-lg p-6">
          {/* Header row */}
          <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
            <h3 className="text-sm text-zinc-400">Account Status</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>
                Portfolio Size:{" "}
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

          {/* Three-column: Next Payout + Drawdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {/* Next Expected Payout */}
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Next Expected Payout</span>
              </div>
              <div className="text-xl font-light tracking-tight text-green-400 mb-2 font-mono">
                {formatUSD(Math.max(0, totalPnl))}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Based on closed PnL this period
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
          </div>

          {/* Promotion Progress */}
          <div className="border-t border-white/[0.06] pt-5">
            <h4 className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">
              Promotion Progress
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Sharpe Ratio */}
              <div>
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Sharpe Ratio</span>
                  <span>Min: {sharpeTarget.toFixed(1)}</span>
                </div>
                <div className={`text-xl font-light tracking-tight mb-2 font-mono ${sharpeRatio != null && sharpeRatio >= sharpeTarget ? "text-green-400" : ""}`}>
                  {sharpeInsufficient ? "N/A" : sharpeRatio != null ? sharpeRatio.toFixed(2) : "--"}
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] ${
                      sharpePct >= 100 ? "bg-green-500" : sharpePct >= 75 ? "bg-teal-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${sharpePct}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {sharpeInsufficient ? "Requires 60+ days of data" : sharpeRatio == null ? "Loading..." : sharpeRatio >= sharpeTarget ? "Target met" : `${sharpePct.toFixed(1)}% of target`}
                </p>
              </div>

              {/* Quarterly PnL */}
              <div>
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Quarterly PnL</span>
                  <span>Min: {quarterlyTarget}%</span>
                </div>
                <div className={`text-xl font-light tracking-tight mb-2 font-mono ${quarterlyPnlPct != null && quarterlyPnlPct >= quarterlyTarget ? "text-green-400" : quarterlyPnlPct != null && quarterlyPnlPct < 0 ? "text-red-400" : ""}`}>
                  {quarterlyPnlPct != null ? `${quarterlyPnlPct >= 0 ? "+" : ""}${quarterlyPnlPct.toFixed(2)}%` : "--"}
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] ${
                      quarterlyPct >= 100 ? "bg-green-500" : quarterlyPct >= 75 ? "bg-teal-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${quarterlyPct}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {quarterlyPnlPct == null ? "Loading..." : quarterlyPnlPct >= quarterlyTarget ? "Target met" : `${quarterlyPct.toFixed(1)}% of target`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
