"use client";

import { useQuery } from "@tanstack/react-query";

const FUNDED_DEMO_LOOKUP = "0x7939aF2C9889F59A96C3921B515300A9a70898BD".toLowerCase();
const FUNDED_DEMO_SUBACCOUNT_UUID = "9e8d1f4f-30f8-4d5a-95a0-b96ba6e026c2";

function normalizeAddress(address) {
  return String(address || "").trim().toLowerCase();
}

function buildFundedDemoDashboard(hlAddress) {
  const now = Date.now();
  const week = 7 * 86_400_000;

  return {
    status: "success",
    timestamp: now,
    synthetic_hotkey: "hk_demo_funded_01",
    subaccount_uuid: FUNDED_DEMO_SUBACCOUNT_UUID,
    subaccount_id: 1842,
    asset_class: "crypto",
    account_size: 100000,
    subaccount_status: "active",
    created_at_ms: now - 90 * 86_400_000,
    eliminated_at_ms: null,
    hl_address: hlAddress,
    payout_address: "0x7939aF2C9889F59A96C3921B515300A9a70898BD",
    challenge_period: {
      bucket: "SUBACCOUNT_FUNDED",
      start_time_ms: now - 60 * 86_400_000,
    },
    drawdown: {
      current_equity: 1.1736,
      daily_open_equity: 1.1688,
      eod_hwm: 1.1819,
      last_eod_equity: 1.1692,
      intraday_drawdown_pct: 1.14,
      eod_drawdown_pct: 2.29,
      intraday_drawdown_threshold: 0.05,
      eod_drawdown_threshold: 0.08,
      intraday_threshold_pct: 5,
      eod_threshold_pct: 8,
      intraday_usage_pct: 22.8,
      eod_usage_pct: 28.625,
    },
    elimination: null,
    account_size_data: {
      account_size: 100000,
      total_realized_pnl: 17356.48,
      capital_used: 32410.32,
      balance: 117356.48,
      buying_power: 149642.08,
      max_return: 1.1819,
    },
    positions: {
      positions_time_ms: now,
      all_time_returns: 1.1736,
      total_leverage: 1.42,
      positions: [
        {
          position_uuid: "funded-demo-pos-1",
          trade_pair: "BTC/USD",
          position_type: "LONG",
          open_ms: now - 18 * 3_600_000,
          current_return: 1.0193,
          average_entry_price: 68412.9,
          realized_pnl: 0,
          net_leverage: 0.55,
          close_ms: null,
          return_at_close: null,
          is_closed_position: false,
          filled_orders: [],
          unfilled_orders: [],
          fee_history: null,
          fees: 16.42,
        },
        {
          position_uuid: "funded-demo-pos-2",
          trade_pair: "ETH/USD",
          position_type: "SHORT",
          open_ms: now - 10 * 3_600_000,
          current_return: 1.0072,
          average_entry_price: 3488.21,
          realized_pnl: 0,
          net_leverage: -0.47,
          close_ms: null,
          return_at_close: null,
          is_closed_position: false,
          filled_orders: [],
          unfilled_orders: [],
          fee_history: null,
          fees: 9.65,
        },
        {
          position_uuid: "funded-demo-pos-3",
          trade_pair: "SOL/USD",
          position_type: "FLAT",
          open_ms: now - 4 * week,
          current_return: 1.0431,
          average_entry_price: 143.18,
          realized_pnl: 4920.14,
          net_leverage: 0,
          close_ms: now - 25 * 3_600_000,
          return_at_close: 1.0431,
          is_closed_position: true,
          filled_orders: [],
          unfilled_orders: [],
          fee_history: null,
          fees: 22.47,
        },
        {
          position_uuid: "funded-demo-pos-4",
          trade_pair: "BTC/USD",
          position_type: "FLAT",
          open_ms: now - 3 * week,
          current_return: 1.0262,
          average_entry_price: 66340.2,
          realized_pnl: 7318.66,
          net_leverage: 0,
          close_ms: now - 8 * 3_600_000,
          return_at_close: 1.0262,
          is_closed_position: true,
          filled_orders: [],
          unfilled_orders: [],
          fee_history: null,
          fees: 28.14,
        },
        {
          position_uuid: "funded-demo-pos-5",
          trade_pair: "XRP/USD",
          position_type: "FLAT",
          open_ms: now - 2 * week,
          current_return: 0.9938,
          average_entry_price: 0.6142,
          realized_pnl: -882.32,
          net_leverage: 0,
          close_ms: now - 3 * 3_600_000,
          return_at_close: 0.9938,
          is_closed_position: true,
          filled_orders: [],
          unfilled_orders: [],
          fee_history: null,
          fees: 13.05,
        },
      ],
    },
    limit_orders: null,
    limits: {
      status: "success",
      hl_address: hlAddress,
      account_size: 100000,
      max_position_per_pair_usd: 50000,
      max_portfolio_usd: 500000,
      in_challenge_period: false,
      timestamp: now,
    },
    statistics: {
      sharpe: 1.87,
      sortino: 2.41,
      omega: 1.34,
      max_drawdown: 0.0229,
      calmar: 3.14,
    },
    quarterly_pnl: 3420,
  };
}

function buildFundedDemoEvents() {
  const now = Date.now();
  return [
    {
      trade_pair: "BTC/USD",
      order_type: "LONG",
      status: "accepted",
      error_message: "",
      leverage: 0.55,
      price: 69520.4,
      size_usd: 14580,
      timestamp_ms: now - 45 * 60_000,
    },
    {
      trade_pair: "ETH/USD",
      order_type: "SHORT",
      status: "accepted",
      error_message: "",
      leverage: 0.47,
      price: 3438.7,
      size_usd: 12240,
      timestamp_ms: now - 2 * 3_600_000,
    },
    {
      trade_pair: "XRP/USD",
      order_type: "SHORT",
      status: "rejected",
      error_message: "Portfolio limit reached",
      leverage: 0.83,
      price: 0.6214,
      size_usd: 42800,
      timestamp_ms: now - 7 * 3_600_000,
    },
  ];
}

function buildFundedDemoPayout() {
  const now = Date.now();
  return {
    status: "success",
    data: {
      hotkey: "hk_demo_funded_01",
      total_checkpoints: 4,
      payout: 2850.23,
      checkpoints: [
        { checkpoint_ms: now - 7 * 86_400_000, pnl: 2850.23, cumulative_pnl: 9428.68 },
        { checkpoint_ms: now - 14 * 86_400_000, pnl: 2468.12, cumulative_pnl: 6578.45 },
        { checkpoint_ms: now - 21 * 86_400_000, pnl: 2117.5, cumulative_pnl: 4110.33 },
        { checkpoint_ms: now - 28 * 86_400_000, pnl: 1992.83, cumulative_pnl: 1992.83 },
      ],
    },
    timestamp: now,
  };
}

function isFundedDemoAddress(address) {
  return normalizeAddress(address) === FUNDED_DEMO_LOOKUP;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error("Fetch failed");
    err.status = res.status;
    try {
      const body = await res.json();
      err.message = body.error || err.message;
    } catch {}
    throw err;
  }
  return res.json();
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error("Fetch failed");
    err.status = res.status;
    try {
      const b = await res.json();
      err.message = b.error || err.message;
    } catch {}
    throw err;
  }
  return res.json();
}

export function useDashboardData(hlAddress, options = {}) {
  const enabled = !!hlAddress;
  const useFundedDemo = !!options.useFundedDemo && isFundedDemoAddress(hlAddress);

  const dashboard = useQuery({
    queryKey: ["dashboard", hlAddress],
    queryFn: () =>
      useFundedDemo
        ? Promise.resolve(buildFundedDemoDashboard(hlAddress))
        : fetchJSON(`/api/dashboard?hl_address=${hlAddress}`),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const events = useQuery({
    queryKey: ["events", hlAddress],
    queryFn: () =>
      useFundedDemo
        ? Promise.resolve(buildFundedDemoEvents())
        : fetchJSON(`/api/dashboard/events?hl_address=${hlAddress}`),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return { dashboard, events };
}

export function usePayoutData(subaccountUuid, options = {}) {
  const enabled = !!subaccountUuid;
  const useFundedDemo =
    !!options.useFundedDemo && subaccountUuid === FUNDED_DEMO_SUBACCOUNT_UUID;

  // Query the current payout period (last 30 days as default window)
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;

  return useQuery({
    queryKey: ["payout", subaccountUuid],
    queryFn: () =>
      useFundedDemo
        ? Promise.resolve(buildFundedDemoPayout())
        : postJSON("/api/dashboard/payout", {
            subaccount_uuid: subaccountUuid,
            start_time_ms: thirtyDaysAgo,
            end_time_ms: now,
          }),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
