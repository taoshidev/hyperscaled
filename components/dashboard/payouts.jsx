"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUSD, formatTime, truncateAddress } from "@/lib/format";

export function Payouts({ payoutAddress, payoutData }) {
  const [copied, setCopied] = useState(false);

  // Validator response shape: { status, data: { payout, checkpoints, ... }, timestamp }
  const data = payoutData?.data || null;
  const checkpoints = data?.checkpoints || [];
  const currentPayout = data?.payout ?? 0;
  const totalCheckpoints = data?.total_checkpoints ?? checkpoints.length;

  // Compute totals from checkpoints
  const totalPaid = checkpoints.length > 0
    ? checkpoints[0]?.cumulative_pnl ?? checkpoints.reduce((sum, c) => sum + (c.pnl ?? 0), 0)
    : 0;
  const lastCheckpoint = checkpoints.length > 0 ? checkpoints[0] : null;

  const handleCopy = async () => {
    if (!payoutAddress) return;
    try {
      await navigator.clipboard.writeText(payoutAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="space-y-5">
      {/* Payout Wallet */}
      {payoutAddress && (
        <div className="flex items-center justify-between p-4 bg-blue-500/[0.04] border border-blue-500/[0.12] rounded-xl flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/[0.15] border border-blue-500/20 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-0.5 flex items-center gap-1.5">
                Payout Wallet
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/[0.15] text-blue-400 border border-blue-500/20 font-semibold uppercase tracking-wide">
                  Base
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-semibold uppercase tracking-wide">
                  USDC
                </span>
              </div>
              <div className="text-sm font-mono text-white">{truncateAddress(payoutAddress)}</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.04]"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Address"}
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white/[0.015] border border-white/[0.06] rounded-xl">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Paid Out</p>
          <p className="text-xl font-light tracking-tight text-green-400 font-mono">
            {formatUSD(totalPaid)}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Lifetime earnings</p>
        </div>
        <div className="p-4 bg-white/[0.015] border border-white/[0.06] rounded-xl">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Checkpoints</p>
          <p className="text-xl font-light tracking-tight font-mono">{totalCheckpoints}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {totalCheckpoints > 0 ? "Payout periods completed" : "No payouts yet"}
          </p>
        </div>
        <div className="p-4 bg-white/[0.015] border border-white/[0.06] rounded-xl">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Current Period</p>
          <p className="text-xl font-light tracking-tight font-mono">
            {formatUSD(currentPayout)}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {lastCheckpoint ? `Last: ${formatTime(lastCheckpoint.checkpoint_ms)}` : "Pending"}
          </p>
        </div>
      </div>

      {/* Checkpoint History Table */}
      <Card className="bg-zinc-900/70 border-white/[0.08]">
        <CardContent className="p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">
            Payout History
          </p>
          {checkpoints.length === 0 ? (
            <p className="text-sm text-zinc-500">No payout history</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-zinc-500 uppercase tracking-widest">
                    <th className="pb-3 pr-4 font-medium">#</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Payout</th>
                    <th className="pb-3 pr-4 font-medium">Token</th>
                    <th className="pb-3 pr-4 font-medium">Cumulative</th>
                    <th className="pb-3 font-medium">Network</th>
                  </tr>
                </thead>
                <tbody>
                  {checkpoints.map((cp, i) => (
                    <tr key={cp.checkpoint_ms || i} className="border-b border-white/[0.03]">
                      <td className="py-3 pr-4 text-zinc-500">{checkpoints.length - i}</td>
                      <td className="py-3 pr-4">{formatTime(cp.checkpoint_ms)}</td>
                      <td className="py-3 pr-4 font-mono font-medium text-green-400">
                        {formatUSD(cp.pnl)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-500/[0.15] inline-flex items-center justify-center text-[8px] font-bold text-blue-400 border border-blue-500/20">
                            $
                          </span>
                          USDC
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-zinc-300">
                        {formatUSD(cp.cumulative_pnl)}
                      </td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/[0.15]">
                          Base
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
