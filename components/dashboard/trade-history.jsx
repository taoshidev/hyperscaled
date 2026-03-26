"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUSD, formatPrice, formatReturn, formatTime, pnlColor } from "@/lib/format";

function pairName(tradePair) {
  if (Array.isArray(tradePair)) return tradePair[1] || tradePair[0];
  return tradePair || "--";
}

export function TradeHistory({ positions }) {
  const [showAll, setShowAll] = useState(false);

  const all = Array.isArray(positions) ? positions : positions?.positions || [];
  const closed = all
    .filter((p) => p.is_closed_position)
    .sort((a, b) => (b.close_ms || b.closed_at || 0) - (a.close_ms || a.closed_at || 0));

  const visible = showAll ? closed : closed.slice(0, 50);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        {closed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No closed trades</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Pair</th>
                    <th className="pb-2 pr-4">Direction</th>
                    <th className="pb-2 pr-4">Entry Price</th>
                    <th className="pb-2 pr-4">Realized PnL</th>
                    <th className="pb-2 pr-4">Return</th>
                    <th className="pb-2 pr-4">Opened</th>
                    <th className="pb-2">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p, i) => {
                    const direction = p.direction || (p.position_type !== "FLAT" ? p.position_type : null) || p.position_type;
                    const openTime = p.open_ms || p.opened_at;
                    const closeTime = p.close_ms || p.closed_at;
                    const ret = p.return_at_close ?? p.return;
                    return (
                      <tr key={i} className="border-b border-border/50">
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
                        <td className={`py-2 pr-4 font-mono ${pnlColor(p.realized_pnl)}`}>
                          {formatUSD(p.realized_pnl)}
                        </td>
                        <td className={`py-2 pr-4 font-mono ${pnlColor((ret || 1) - 1)}`}>
                          {formatReturn(ret)}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {openTime ? formatTime(openTime) : "--"}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {closeTime ? formatTime(closeTime) : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!showAll && closed.length > 50 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setShowAll(true)}
              >
                Show all {closed.length} trades
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
