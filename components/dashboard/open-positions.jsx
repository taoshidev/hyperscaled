"use client";

import { useState, Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatPrice, formatLeverage, formatReturn, formatUSD, pnlColor } from "@/lib/format";
import { openPositionUnrealizedUsd } from "@/lib/position-utils";
import { ShareButton } from "./share-button";

const COLS = (
  <colgroup>
    <col style={{ width: 32 }} />
    <col style={{ width: 120 }} />
    <col style={{ width: 100 }} />
    <col style={{ width: 130 }} />
    <col style={{ width: 110 }} />
    <col style={{ width: 140 }} />
    <col style={{ width: 100 }} />
    <col style={{ width: 110 }} />
    <col style={{ width: 40 }} />
  </colgroup>
);

function pairName(tradePair) {
  if (Array.isArray(tradePair)) return tradePair[1] || tradePair[0];
  return tradePair || "--";
}

function DirectionBadge({ direction }) {
  return (
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
  );
}

export function OpenPositions({ positions, accountSizeData }) {
  const [expandedRows, setExpandedRows] = useState({});
  const all = Array.isArray(positions) ? positions : positions?.positions || [];
  const open = all.filter((p) => !p.is_closed_position);

  const toggleRow = (uuid) => {
    setExpandedRows((prev) => ({ ...prev, [uuid]: !prev[uuid] }));
  };

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
            <table className="w-full text-sm table-fixed">
              {COLS}
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2" />
                  <th className="pb-2 pr-4">Pair</th>
                  <th className="pb-2 pr-4">Direction</th>
                  <th className="pb-2 pr-4">Entry Price</th>
                  <th className="pb-2 pr-4">Leverage</th>
                  <th className="pb-2 pr-4">Unrealized PnL</th>
                  <th className="pb-2 pr-4">Return</th>
                  <th className="pb-2 pr-4">Fees</th>
                  <th className="pb-2"><span className="sr-only">Share</span></th>
                </tr>
              </thead>
              <tbody>
                {open.map((p, i) => {
                  const direction = p.direction || (p.position_type !== "FLAT" ? p.position_type : null) || p.position_type;
                  const unrealized = openPositionUnrealizedUsd(p, open, accountSizeData);
                  const hasOrders = p.filled_orders && p.filled_orders.length > 0;
                  const isExpanded = !!expandedRows[p.position_uuid || i];
                  return (
                    <Fragment key={p.position_uuid || i}>
                      <tr
                        className={`border-b border-border/50 transition-colors ${hasOrders ? "cursor-pointer hover:bg-white/[0.02]" : ""}`}
                        onClick={hasOrders ? () => toggleRow(p.position_uuid || i) : undefined}
                      >
                        <td className="py-2.5 pr-2 w-6">
                          {hasOrders ? (
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              style={{ display: "inline-flex" }}
                            >
                              <ChevronRight size={14} className="text-zinc-500" />
                            </motion.div>
                          ) : null}
                        </td>
                        <td className="py-2 pr-4 font-medium">
                          {pairName(p.trade_pair || p.pair)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <DirectionBadge direction={direction} />
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
                        <td className="py-2 pr-4 font-mono text-zinc-500">
                          {p.fees != null ? `-${formatUSD(p.fees)}` : "--"}
                        </td>
                        <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <ShareButton
                            trade={{
                              ticker: pairName(p.trade_pair || p.pair).replace(/\/.*$/, ""),
                              direction,
                              returnValue: p.current_return || 1,
                              entryPrice: p.average_entry_price ?? p.entry_price,
                              markPrice: null,
                            }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={9} className="p-0" style={{ border: 0 }}>
                          <AnimatePresence initial={false}>
                            {isExpanded && hasOrders && (
                              <motion.div
                                key="orders"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
                                style={{ overflow: "hidden" }}
                              >
                                <table className="w-full table-fixed">
                                  {COLS}
                                  <tbody>
                                    {p.filled_orders.map((order, oi) => (
                                      <tr
                                        key={order.order_uuid || oi}
                                        className="border-b border-border/30 bg-zinc-900/40 text-xs"
                                      >
                                        <td className="py-1.5 text-zinc-600 pl-1">↳</td>
                                        <td className="py-1.5 pr-4 text-zinc-500">Order {oi + 1}</td>
                                        <td className="py-1.5 pr-4">
                                          <DirectionBadge direction={order.order_type} />
                                        </td>
                                        <td className="py-1.5 pr-4 font-mono text-zinc-400">
                                          {order.price ? formatPrice(order.price) : "--"}
                                        </td>
                                        <td className="py-1.5 pr-4 font-mono text-zinc-400">
                                          {order.leverage != null ? formatLeverage(order.leverage) : "--"}
                                        </td>
                                        <td className="py-1.5 pr-4 text-zinc-600">--</td>
                                        <td className="py-1.5 pr-4 text-zinc-600">
                                          {order.execution_type || "--"}
                                        </td>
                                        <td className="py-1.5 pr-4 text-zinc-600">--</td>
                                        <td className="py-1.5" />
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    </Fragment>
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
