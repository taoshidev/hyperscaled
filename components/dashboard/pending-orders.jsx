"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatUSD, formatLeverage } from "@/lib/format";

export function PendingOrders({ limitOrders }) {
  const orders = limitOrders || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Pair</th>
                  <th className="pb-2 pr-4">Order Type</th>
                  <th className="pb-2 pr-4">Price</th>
                  <th className="pb-2">Leverage</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">{o.pair}</td>
                    <td className="py-2 pr-4">{o.order_type}</td>
                    <td className="py-2 pr-4">{formatUSD(o.price)}</td>
                    <td className="py-2">{formatLeverage(o.leverage)}</td>
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
