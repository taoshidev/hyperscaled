"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice, formatLeverage, formatReturn, formatUSD, pnlColor } from "@/lib/format";
import { openPositionUnrealizedUsd } from "@/lib/position-utils";

function pairName(tradePair) {
  if (Array.isArray(tradePair)) return tradePair[1] || tradePair[0];
  return tradePair || "--";
}

export function OpenPositions({ positions, accountSizeData }) {
  const all = Array.isArray(positions) ? positions : positions?.positions || [];
  const open = all.filter((p) => !p.is_closed_position);

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          <span className="flex items-center gap-2">
            Open Positions
            {open.length > 0 && (
              <span className="text-xs font-normal text-zinc-500">{open.length}</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {open.length === 0 ? (
          <p className="text-sm text-zinc-500">No open positions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Pair</th>
                  <th className="pb-2 pr-4">Direction</th>
                  <th className="pb-2 pr-4">Entry Price</th>
                  <th className="pb-2 pr-4">Leverage</th>
                  <th className="pb-2 pr-4">Unrealized PnL</th>
                  <th className="pb-2 pr-4">Return</th>
                  <th className="pb-2">Fees</th>
                </tr>
              </thead>
              <tbody>
                {open.map((p, i) => {
                  const direction = p.direction || (p.position_type !== "FLAT" ? p.position_type : null) || p.position_type;
                  const unrealized = openPositionUnrealizedUsd(p, open, accountSizeData);
                  return (
                    <tr key={p.position_uuid || i} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">
                        {pairName(p.trade_pair || p.pair)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold border ${
                            direction === "LONG"
                              ? "bg-teal-400/10 text-teal-400 border-teal-400/20"
                              : direction === "SHORT"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {direction}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-zinc-300">
                        {formatPrice(p.average_entry_price ?? p.entry_price)}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-zinc-300">
                        {formatLeverage(p.net_leverage ?? p.leverage)}
                      </td>
                      <td
                        className={`py-2 pr-4 font-mono ${
                          unrealized != null ? pnlColor(unrealized) : "text-zinc-500"
                        }`}
                      >
                        {unrealized != null
                          ? `${unrealized >= 0 ? "+" : ""}${formatUSD(unrealized)}`
                          : "--"}
                      </td>
                      <td className={`py-2 pr-4 font-mono ${pnlColor((p.current_return || 1) - 1)}`}>
                        {formatReturn(p.current_return)}
                      </td>
                      <td className="py-2 font-mono text-zinc-500">
                        {p.fees != null ? `-${formatUSD(p.fees)}` : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Margin Used */}
        {accountSizeData && accountSizeData.capital_used != null && (() => {
          const capUsed = accountSizeData.capital_used || 0;
          const buyingPower = accountSizeData.buying_power || 0;
          const total = capUsed + buyingPower;
          const pct = total > 0 ? (capUsed / total) * 100 : capUsed > 0 ? 100 : 0;
          return (
            <div className="mt-3 px-4 py-3 bg-white/[0.015] border border-white/[0.06] rounded-md flex items-center gap-3">
              <span className="text-xs text-zinc-500 whitespace-nowrap">Margin Used</span>
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width]"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <span className="text-xs font-medium font-mono whitespace-nowrap">
                {pct.toFixed(1)}%{" "}
                <span className="text-zinc-500 font-normal">
                  of {formatUSD(total)}
                </span>
              </span>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
