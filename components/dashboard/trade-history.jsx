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
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          <span className="flex items-center gap-2">
            Trade History
            {closed.length > 0 && (
              <span className="text-xs font-normal text-zinc-500">{closed.length}</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {closed.length === 0 ? (
          <p className="text-sm text-zinc-500">No closed trades</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-zinc-500 uppercase tracking-widest">
                    <th className="pb-2 pr-4 font-medium">Pair</th>
                    <th className="pb-2 pr-4 font-medium">Direction</th>
                    <th className="pb-2 pr-4 font-medium">Entry Price</th>
                    <th className="pb-2 pr-4 font-medium">Realized PnL</th>
                    <th className="pb-2 pr-4 font-medium">Return</th>
                    <th className="pb-2 pr-4 font-medium">Opened</th>
                    <th className="pb-2 font-medium">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p, i) => {
                    const direction = p.direction || (p.position_type !== "FLAT" ? p.position_type : null) || p.position_type;
                    const openTime = p.open_ms || p.opened_at;
                    const closeTime = p.close_ms || p.closed_at;
                    const ret = p.return_at_close ?? p.return;
                    return (
                      <tr key={p.position_uuid || i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-[background-color]">
                        <td className="py-2.5 pr-4 font-medium">
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
                        <td className={`py-2.5 pr-4 font-mono font-semibold ${pnlColor(p.realized_pnl)}`}>
                          {formatUSD(p.realized_pnl)}
                        </td>
                        <td className={`py-2.5 pr-4 font-mono font-semibold ${pnlColor((ret || 1) - 1)}`}>
                          {formatReturn(ret)}
                        </td>
                        <td className="py-2.5 pr-4 text-zinc-500 text-xs">
                          {openTime ? formatTime(openTime) : "--"}
                        </td>
                        <td className="py-2.5 text-zinc-500 text-xs">
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
                className="mt-3 w-full text-zinc-400 hover:text-white hover:bg-white/[0.04]"
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
