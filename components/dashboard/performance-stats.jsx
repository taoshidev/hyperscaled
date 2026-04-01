"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatUSD, pnlColor } from "@/lib/format";

function EquityCurve({ positions }) {
  const { linePath, fillPath } = useMemo(() => {
    // Build cumulative PnL curve from closed positions sorted by close time
    const closed = positions
      .filter((p) => p.is_closed_position && p.close_ms)
      .sort((a, b) => (a.close_ms || 0) - (b.close_ms || 0));

    if (closed.length === 0) {
      return { linePath: "", fillPath: "" };
    }

    // Start at 0, accumulate realized PnL at each close
    const points = [0];
    let cumPnl = 0;
    for (const p of closed) {
      cumPnl += p.realized_pnl ?? 0;
      points.push(cumPnl);
    }

    // For open positions, add current unrealized return estimate
    const openPositions = positions.filter((p) => !p.is_closed_position);
    for (const p of openPositions) {
      const ret = (p.current_return || 1) - 1;
      // Approximate unrealized PnL from return
      cumPnl += ret * 100; // rough scale
      points.push(cumPnl);
    }

    const W = 800;
    const H = 200;
    const padding = 10;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const coords = points.map((val, i) => {
      const x = points.length === 1 ? W / 2 : (i / (points.length - 1)) * W;
      const y = padding + (1 - (val - min) / range) * (H - padding * 2);
      return [x, y];
    });

    // Build smooth line using SVG L commands
    const lineSegments = coords.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
    const fill = `${lineSegments} L${W},${H} L0,${H} Z`;

    return { linePath: lineSegments, fillPath: fill };
  }, [positions]);

  if (!linePath) {
    return (
      <div className="h-[220px] bg-white/[0.01] border border-white/[0.06] rounded-md flex items-center justify-center">
        <p className="text-xs text-zinc-500">No trade data for equity curve</p>
      </div>
    );
  }

  return (
    <div className="h-[220px] bg-white/[0.01] border border-white/[0.06] rounded-md relative overflow-hidden">
      <svg
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        className="w-full h-full absolute bottom-0"
      >
        <defs>
          <linearGradient id="eq-curve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#eq-curve-fill)" />
        <path d={linePath} fill="none" stroke="rgba(59,130,246,0.6)" strokeWidth="2" />
      </svg>
    </div>
  );
}

const FILTERS = ["1D", "1W", "1M", "All"];
const FILTER_MS = { "1D": 86_400_000, "1W": 7 * 86_400_000, "1M": 30 * 86_400_000, All: null };

export function PerformanceStats({ positions }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [now] = useState(() => Date.now());

  const all = Array.isArray(positions) ? positions : positions?.positions || [];

  const cutoff = FILTER_MS[activeFilter] != null ? now - FILTER_MS[activeFilter] : null;

  // For stats: filter closed positions by close_ms within window
  const closed = all.filter(
    (p) => p.is_closed_position && (cutoff == null || (p.close_ms ?? 0) >= cutoff),
  );
  // Open positions are always current — include them only in "All"
  const open = all.filter((p) => !p.is_closed_position);
  const totalTrades = closed.length + (cutoff == null ? open.length : 0);
  const closedCount = closed.length;

  const wins = closed.filter((p) => (p.realized_pnl ?? 0) > 0).length;
  const winRate = closedCount > 0 ? Math.round((wins / closedCount) * 100) : 0;

  const totalPnl = closed.reduce((sum, p) => sum + (p.realized_pnl ?? 0), 0);
  const avgPnl = closedCount > 0 ? totalPnl / closedCount : 0;

  const durations = closed
    .filter((p) => p.open_ms && p.close_ms)
    .map((p) => (p.close_ms || p.closed_at || 0) - (p.open_ms || p.opened_at || 0));
  const avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const longestMs = durations.length > 0 ? Math.max(...durations) : 0;

  function formatDuration(ms) {
    if (ms <= 0) return "--";
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  }

  const stats = [
    {
      label: "Total Trades",
      value: String(totalTrades),
      sub: cutoff == null ? `${closedCount} closed \u00b7 ${open.length} open` : `${closedCount} closed`,
      color: null,
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      sub: `${wins}W / ${closedCount - wins}L`,
      color: winRate >= 50 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Avg Trade PnL",
      value: avgPnl >= 0 ? `+${formatUSD(avgPnl)}` : formatUSD(avgPnl),
      sub: `${formatUSD(totalPnl)} total`,
      color: pnlColor(avgPnl),
    },
    {
      label: "Avg Duration",
      value: formatDuration(avgDurationMs),
      sub: longestMs > 0 ? `Longest: ${formatDuration(longestMs)}` : "--",
      color: null,
    },
  ];

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Performance</p>
          <div className="flex gap-1">
            {FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveFilter(t)}
                className={`px-3 py-1.5 text-xs rounded transition-[background-color,color,border-color] ${
                  activeFilter === t
                    ? "text-white bg-white/[0.06] border border-white/[0.08]"
                    : "text-zinc-500 border border-transparent hover:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-white/[0.06] mb-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-zinc-500 mb-0.5">{s.label}</p>
              <p className={`text-lg font-light tracking-tight ${s.color || ""}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Equity Curve */}
        <EquityCurve positions={cutoff == null ? all : closed} />
      </CardContent>
    </Card>
  );
}
