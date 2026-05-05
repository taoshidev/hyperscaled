"use client";

import { forwardRef } from "react";
import { formatPrice } from "@/lib/format";

const ASSET_COLORS = {
  BTC: "#f7931a",
  ETH: "#627eea",
  SOL: "#9945ff",
  DOGE: "#c3a634",
  AVAX: "#e84142",
  LINK: "#2a5ada",
  MATIC: "#8247e5",
  ARB: "#28a0f0",
  OP: "#ff0420",
  APT: "#00bfa5",
  SUI: "#4da2ff",
  WIF: "#d4a843",
  PEPE: "#4b8b3b",
  WLD: "#1a1a2e",
  INJ: "#00f2fe",
  TIA: "#7b2ff7",
  SEI: "#9b1c31",
  JUP: "#00c4a1",
  RENDER: "#1a1a2e",
};

const CONFETTI = [
  { top: "8%", left: "42%", w: 6, h: 14, rotate: 35, opacity: 0.6 },
  { top: "12%", right: "22%", w: 4, h: 4, rotate: 0, opacity: 0.5, round: true },
  { top: "6%", right: "30%", w: 5, h: 12, rotate: -25, opacity: 0.7 },
  { top: "18%", left: "55%", w: 4, h: 4, rotate: 45, opacity: 0.4, round: true },
  { top: "25%", right: "15%", w: 6, h: 14, rotate: 60, opacity: 0.5 },
  { top: "72%", left: "38%", w: 5, h: 12, rotate: -40, opacity: 0.5 },
  { top: "80%", left: "50%", w: 4, h: 4, rotate: 0, opacity: 0.4, round: true },
  { top: "65%", right: "28%", w: 6, h: 14, rotate: 15, opacity: 0.6 },
  { top: "85%", right: "35%", w: 5, h: 12, rotate: -55, opacity: 0.5 },
  { top: "15%", left: "32%", w: 4, h: 4, rotate: 0, opacity: 0.35, round: true },
  { top: "45%", right: "10%", w: 5, h: 13, rotate: 70, opacity: 0.45 },
  { top: "55%", right: "20%", w: 4, h: 4, rotate: 0, opacity: 0.3, round: true },
  { top: "90%", left: "45%", w: 6, h: 14, rotate: -30, opacity: 0.4 },
  { top: "35%", left: "48%", w: 4, h: 4, rotate: 0, opacity: 0.35, round: true },
  { top: "3%", left: "60%", w: 5, h: 12, rotate: 50, opacity: 0.5 },
];

function formatPnl(returnValue) {
  const pct = (returnValue - 1) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export const TradeCard = forwardRef(function TradeCard(
  { ticker, direction, returnValue, entryPrice, markPrice },
  ref
) {
  const isWin = returnValue >= 1;
  const pnlColor = isWin ? "#00C6A7" : "#ef4444";
  const assetColor = ASSET_COLORS[ticker] || "#00C6A7";
  const derivedMark = markPrice || entryPrice * returnValue;
  const dirBadgeBg = direction === "LONG"
    ? "rgba(0,198,167,0.15)"
    : direction === "SHORT"
      ? "rgba(239,68,68,0.15)"
      : "rgba(161,161,170,0.15)";
  const dirBadgeColor = direction === "LONG"
    ? "#00C6A7"
    : direction === "SHORT"
      ? "#ef4444"
      : "#a1a1aa";

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        height: 630,
        background: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Satoshi', ui-sans-serif, system-ui, -apple-system, sans-serif",
        display: "flex",
      }}
    >
      {CONFETTI.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            right: c.right,
            width: c.w,
            height: c.h,
            background: "#00C6A7",
            borderRadius: c.round ? "50%" : 1,
            opacity: c.opacity,
            transform: `rotate(${c.rotate}deg)`,
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 0 52px 64px",
          position: "relative",
          zIndex: 2,
          flex: "0 0 55%",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src="/hyperscaled-mark.svg"
            alt=""
            width={44}
            height={44}
            style={{ display: "block" }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.01em",
            }}
          >
            Hyperscaled
          </span>
        </div>

        {/* Trade info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Asset + direction */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: assetColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                color: "white",
              }}
            >
              {ticker === "BTC" ? "₿" : ticker[0]}
            </div>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "white",
                letterSpacing: "-0.01em",
              }}
            >
              {ticker}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: dirBadgeColor,
                background: dirBadgeBg,
                padding: "5px 14px",
                borderRadius: 6,
                letterSpacing: "0.04em",
              }}
            >
              {direction}
            </span>
          </div>

          {/* PnL */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: pnlColor,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {formatPnl(returnValue)}
          </div>

          {/* Price grid */}
          <div style={{ display: "flex", gap: 64 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 500,
                }}
              >
                Entry Price
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "white",
                  fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
                }}
              >
                {formatPrice(entryPrice)}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 500,
                }}
              >
                Mark Price
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "white",
                  fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
                }}
              >
                {formatPrice(derivedMark)}
              </span>
            </div>
          </div>
        </div>

        {/* URL */}
        <span
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.4)",
            fontWeight: 500,
          }}
        >
          Hyperscaled.trade
        </span>
      </div>

      {/* Cat mascot */}
      <div
        style={{
          position: "absolute",
          right: -20,
          bottom: 0,
          top: 0,
          display: "flex",
          alignItems: "flex-end",
          zIndex: 1,
        }}
      >
        <img
          src="/cat-mascot.png"
          alt=""
          style={{
            height: "100%",
            width: "auto",
            objectFit: "contain",
            objectPosition: "right bottom",
          }}
        />
      </div>
    </div>
  );
});
