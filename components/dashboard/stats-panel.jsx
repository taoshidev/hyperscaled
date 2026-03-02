"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatLabel } from "@/lib/format";

export function StatsPanel({ statistics }) {
  const entries = statistics ? Object.entries(statistics) : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No statistics available</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatLabel(key)}
                </span>
                <span className="font-medium">
                  {value != null ? String(value) : "--"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
