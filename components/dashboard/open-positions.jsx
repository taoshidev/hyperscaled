"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatUSD, formatLeverage, formatReturn, pnlColor } from "@/lib/format";

export function OpenPositions({ positions }) {
  const open = (positions?.positions || []).filter(
    (p) => !p.is_closed_position,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open positions</p>
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
                  <th className="pb-2">Return</th>
                </tr>
              </thead>
              <tbody>
                {open.map((p, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">{p.pair}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                          p.direction === "LONG"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {p.direction}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{formatUSD(p.entry_price)}</td>
                    <td className="py-2 pr-4">{formatLeverage(p.leverage)}</td>
                    <td className={`py-2 pr-4 ${pnlColor(p.unrealized_pnl)}`}>
                      {formatUSD(p.unrealized_pnl)}
                    </td>
                    <td className={`py-2 ${pnlColor((p.current_return || 1) - 1)}`}>
                      {formatReturn(p.current_return)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
