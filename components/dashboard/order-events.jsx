"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { formatTime, formatPrice, formatLeverage, formatUSD } from "@/lib/format";

export function OrderEvents({ events }) {
  const items = Array.isArray(events) ? events.slice(0, 50) : [];

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          <span className="flex items-center gap-2">
            Order Events
            {items.length > 0 && (
              <span className="text-xs font-normal text-zinc-500">{items.length}</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">No events yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map((e, i) => {
              const accepted = e.status === "accepted";
              const pair = e.trade_pair || e.pair;
              const error = e.error_message || e.error;
              const ts = e.timestamp_ms || e.timestamp;
              const isLong = e.order_type === "LONG";
              const isShort = e.order_type === "SHORT";
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 text-sm border-b border-white/[0.04] pb-3 last:border-0"
                >
                  {accepted ? (
                    <CheckCircle weight="fill" className="h-4 w-4 mt-0.5 shrink-0 text-green-400" />
                  ) : (
                    <XCircle weight="fill" className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pair}</span>
                      <span className={isLong ? "text-green-400" : isShort ? "text-red-400" : "text-muted-foreground"}>
                        {e.order_type}
                      </span>
                      {e.leverage != null && (
                        <span className="font-mono text-muted-foreground">
                          {formatLeverage(e.leverage)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {e.price != null && (
                        <span className="text-xs font-mono text-muted-foreground">
                          @ {formatPrice(e.price)}
                        </span>
                      )}
                      {e.size_usd != null && (
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatUSD(e.size_usd)}
                        </span>
                      )}
                    </div>
                    {error && (
                      <p className="text-xs text-red-400 mt-0.5">{error}</p>
                    )}
                    {ts && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(ts)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
