"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { formatTime } from "@/lib/format";

export function OrderEvents({ events }) {
  const items = Array.isArray(events) ? events.slice(0, 50) : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Order Events</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map((e, i) => {
              const accepted = e.status === "accepted";
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0"
                >
                  {accepted ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{e.pair}</span>
                      <span className="text-muted-foreground">
                        {e.order_type}
                      </span>
                    </div>
                    {e.error && (
                      <p className="text-xs text-red-400 mt-0.5">{e.error}</p>
                    )}
                    {e.timestamp && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(e.timestamp)}
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
