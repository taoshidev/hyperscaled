"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice, formatLeverage, formatReturn, pnlColor } from "@/lib/format";

function pairName(tradePair) {
  if (Array.isArray(tradePair)) return tradePair[1] || tradePair[0];
  return tradePair || "--";
}

export function OpenPositions({ positions }) {
  const all = Array.isArray(positions) ? positions : positions?.positions || [];
  const open = all.filter((p) => !p.is_closed_position);

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
                  <th className="pb-2">Return</th>
                </tr>
              </thead>
              <tbody>
                {open.map((p, i) => {
                  const direction = p.direction || (p.position_type !== "FLAT" ? p.position_type : null) || p.position_type;
                  return (
                    <tr key={p.position_uuid || i} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">
                        {pairName(p.trade_pair || p.pair)}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                            direction === "LONG"
                              ? "bg-green-500/20 text-green-400"
                              : direction === "SHORT"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          {direction}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-mono">
                        {formatPrice(p.average_entry_price ?? p.entry_price)}
                      </td>
                      <td className="py-2 pr-4 font-mono">
                        {formatLeverage(p.net_leverage ?? p.leverage)}
                      </td>
                      <td className={`py-2 font-mono ${pnlColor((p.current_return || 1) - 1)}`}>
                        {formatReturn(p.current_return)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
