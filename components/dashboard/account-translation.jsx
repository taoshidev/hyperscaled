"use client";

import { ArrowRight, Info } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { formatUSD, formatAccountSize, pnlColor } from "@/lib/format";
import {
  openPositionUnrealizedUsd,
  openPositionsUnrealizedTotalUsd,
} from "@/lib/position-utils";
import {
  mirrorRatio,
  scaleEquity,
  formatRatio,
} from "@/lib/translation";
import { useHlBalance } from "@/hooks/use-hl-balance";

function Column({ eyebrow, label, value, valueClass, rows }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
        {eyebrow}
      </p>
      <p className="text-sm text-zinc-400 mt-1">{label}</p>
      <p
        className={`mt-1 text-2xl sm:text-3xl font-light tracking-tight font-mono ${valueClass || "text-white"}`}
      >
        {value}
      </p>
      {rows && rows.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-zinc-500 truncate mr-3">{row.label}</span>
              <span className={`font-mono tabular-nums ${row.className || "text-zinc-300"}`}>
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AccountTranslation({ dashboard, watchedAddress, canReadHlBalance }) {
  const accountSize = dashboard?.account_size;
  const accountSizeData = dashboard?.account_size_data;
  const challengeEquity = accountSizeData?.balance;
  const allPositions = Array.isArray(dashboard?.positions?.positions)
    ? dashboard.positions.positions
    : [];
  const openPositions = allPositions.filter((p) => !p.is_closed_position);

  const { balance: hlBalance, isLoading: hlLoading, error: hlError } = useHlBalance(
    watchedAddress,
    { enabled: canReadHlBalance },
  );

  const hasHlReading = canReadHlBalance && hlBalance != null && hlBalance > 0;
  const ratio = hasHlReading ? mirrorRatio(accountSize, hlBalance) : null;

  const challengeTotalUnrealized = openPositionsUnrealizedTotalUsd(
    openPositions,
    accountSizeData,
  );
  const hlTotalUnrealized =
    ratio && ratio > 0 ? challengeTotalUnrealized / ratio : null;

  const challengeRows = openPositions.slice(0, 3).map((p) => {
    const pnlChallenge = openPositionUnrealizedUsd(p, openPositions, accountSizeData);
    const val = Number.isFinite(pnlChallenge) ? pnlChallenge : 0;
    const sign = val >= 0 ? "+" : "";
    return {
      key: p.position_uuid,
      label: p.trade_pair,
      value: `${sign}${formatUSD(val)}`,
      className: pnlColor(val),
    };
  });

  const hlRows = openPositions.slice(0, 3).map((p) => {
    const pnlChallenge = openPositionUnrealizedUsd(p, openPositions, accountSizeData);
    const raw = ratio && ratio > 0 ? (Number.isFinite(pnlChallenge) ? pnlChallenge / ratio : 0) : 0;
    const sign = raw >= 0 ? "+" : "";
    return {
      key: p.position_uuid,
      label: p.trade_pair,
      value: `${sign}${formatUSD(raw)}`,
      className: pnlColor(raw),
    };
  });

  const headerSub =
    accountSize != null ? `${formatAccountSize(accountSize)} Challenge` : "Challenge";

  // Unreadable states — still render the card, just education + empty right column.
  if (!canReadHlBalance) {
    return (
      <Card className="bg-zinc-900/70 border-white/[0.08]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-teal-400 font-medium">
                Account Translation
              </p>
              <p className="text-sm text-zinc-300 mt-1">
                How your Hyperliquid activity maps to your{" "}
                <span className="text-white">{headerSub}</span>
              </p>
            </div>
            <span className="shrink-0 text-xs text-zinc-500 font-mono bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-md">
              lookup mode
            </span>
          </div>
          <p className="mt-5 text-sm text-zinc-400 max-w-xl">
            Connect the wallet you trade on Hyperliquid with to see your live HL
            balance translated into this challenge account size. You trade as
            normal; Hyperscaled scales your performance up to {headerSub}.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hlLoading && hlBalance == null) {
    return (
      <Card className="bg-zinc-900/70 border-white/[0.08]">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="skeleton h-3 w-36 rounded" />
          <div className="flex gap-6">
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-8 w-28 rounded" />
            </div>
            <div className="skeleton h-8 w-8 rounded-full self-center" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-8 w-28 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hlError || !hasHlReading) {
    return (
      <Card className="bg-zinc-900/70 border-white/[0.08]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-teal-400 font-medium">
                Account Translation
              </p>
              <p className="text-sm text-zinc-300 mt-1">
                How your Hyperliquid activity maps to your{" "}
                <span className="text-white">{headerSub}</span>
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-2 text-sm text-zinc-400">
            <Info size={16} weight="duotone" className="text-zinc-500 mt-0.5 shrink-0" />
            <p>
              Can't read your Hyperliquid balance right now. Once you deposit $100+
              USDC on Hyperliquid, this card will show the live scale factor between
              your HL account and your {headerSub}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const challengeEquityValue =
    challengeEquity != null ? formatUSD(challengeEquity) : formatUSD(scaleEquity(hlBalance, ratio));

  const hasOpen = openPositions.length > 0;
  const caption = hasOpen
    ? `Your ${formatUSD(hlBalance)} position on Hyperliquid is mirrored as ${formatUSD(scaleEquity(hlBalance, ratio))} on your challenge — every P&L swing counts at ${formatRatio(ratio)}.`
    : `Your ${formatUSD(hlBalance)} on Hyperliquid is treated as ${formatUSD(scaleEquity(hlBalance, ratio))} on your challenge. Place a trade on Hyperliquid — it's mirrored at ${formatRatio(ratio)} onto this account.`;

  return (
    <Card className="bg-zinc-900/70 border-white/[0.08]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-teal-400 font-medium">
              Account Translation
            </p>
            <p className="text-sm text-zinc-300 mt-1">
              Your Hyperliquid activity → your{" "}
              <span className="text-white">{headerSub}</span>
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-mono text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2.5 py-1 rounded-full">
            {formatRatio(ratio)} scale
          </span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <Column
            eyebrow="Your Hyperliquid"
            label="Account equity"
            value={formatUSD(hlBalance)}
            valueClass="text-white"
            rows={
              hasOpen
                ? [
                    {
                      key: "total",
                      label: "Open P&L",
                      value: `${hlTotalUnrealized != null && hlTotalUnrealized >= 0 ? "+" : ""}${formatUSD(hlTotalUnrealized || 0)}`,
                      className: pnlColor(hlTotalUnrealized || 0),
                    },
                    ...hlRows,
                  ]
                : []
            }
          />

          <div className="shrink-0 flex flex-col items-center text-zinc-500">
            <ArrowRight size={20} weight="bold" className="text-teal-400" />
            <span className="mt-1 text-[10px] uppercase tracking-widest font-medium">
              {formatRatio(ratio)}
            </span>
          </div>

          <Column
            eyebrow={headerSub}
            label="Challenge equity"
            value={challengeEquityValue}
            valueClass={
              challengeEquity != null && accountSize != null
                ? pnlColor(challengeEquity - accountSize)
                : "text-white"
            }
            rows={
              hasOpen
                ? [
                    {
                      key: "total",
                      label: "Open P&L",
                      value: `${challengeTotalUnrealized >= 0 ? "+" : ""}${formatUSD(challengeTotalUnrealized)}`,
                      className: pnlColor(challengeTotalUnrealized),
                    },
                    ...challengeRows,
                  ]
                : []
            }
          />
        </div>

        <p className="mt-5 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
          {caption}
        </p>
      </CardContent>
    </Card>
  );
}
