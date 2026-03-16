// Stub data for development when the trading gateway is not available.
// Shaped to match the validator /hl-traders/<address> response.
// To go live: remove STUB_GATEWAY=true from .env.local

export const STUB_ENABLED = process.env.STUB_GATEWAY === "true";

export const stubStatus = {
  endpoint_url: "https://stub.gateway.local",
  hl_address: "0x0000000000000000000000000000000000000000",
  status: "active",
};

export const stubDashboard = {
  status: "success",
  synthetic_hotkey: "stub_hotkey_0",
  hl_address: "0x0000000000000000000000000000000000000000",
  account_size: 10000.0,
  payout_address: "0x0000000000000000000000000000000000000001",
  positions: [
    {
      pair: "BTC-PERP",
      direction: "LONG",
      entry_price: 67500.0,
      leverage: 3,
      unrealized_pnl: 325.5,
      current_return: 1.032,
      is_closed_position: false,
    },
    {
      pair: "ETH-PERP",
      direction: "SHORT",
      entry_price: 3450.0,
      leverage: 5,
      unrealized_pnl: -48.2,
      current_return: 0.986,
      is_closed_position: false,
    },
    {
      pair: "SOL-PERP",
      direction: "LONG",
      entry_price: 142.5,
      leverage: 2,
      realized_pnl: 187.3,
      return: 1.045,
      is_closed_position: true,
      opened_at: Date.now() - 86400000 * 3,
      closed_at: Date.now() - 86400000,
    },
    {
      pair: "ETH-PERP",
      direction: "LONG",
      entry_price: 3200.0,
      leverage: 4,
      realized_pnl: -95.0,
      return: 0.97,
      is_closed_position: true,
      opened_at: Date.now() - 86400000 * 5,
      closed_at: Date.now() - 86400000 * 4,
    },
  ],
  drawdown: {
    instant: 0.018,
    daily: 0.012,
    ledger_max_drawdown: 0.045,
  },
  challenge_progress: {
    in_challenge_period: true,
    bucket: "SUBACCOUNT_CHALLENGE",
    start_time_ms: Date.now() - 864000000,
    elapsed_time_ms: 864000000,
    time_progress_percent: 11.11,
    current_return: 1.06,
    returns_percent: 6.0,
    target_return_percent: 10.0,
    returns_progress_percent: 60.0,
    challenge_completion_percent: 60.0,
    drawdown_percent: 1.85,
    drawdown_limit_percent: 5.0,
    drawdown_usage_percent: 37.0,
  },
  limits: {
    status: "success",
    hl_address: "0x0000000000000000000000000000000000000000",
    account_size: 10000.0,
    max_position_per_pair_usd: 5000.0,
    max_portfolio_usd: 50000.0,
    in_challenge_period: true,
    timestamp: Date.now(),
  },
  elimination: null,
  timestamp: Date.now(),
};

export const stubEvents = [
  {
    trade_pair: "BTC/USD",
    order_type: "LONG",
    status: "accepted",
    error_message: "",
    timestamp_ms: Date.now() - 3600000,
  },
  {
    trade_pair: "ETH/USD",
    order_type: "SHORT",
    status: "accepted",
    error_message: "",
    timestamp_ms: Date.now() - 7200000,
  },
  {
    trade_pair: "SOL/USD",
    order_type: "LONG",
    status: "rejected",
    error_message: "Insufficient margin",
    timestamp_ms: Date.now() - 14400000,
  },
];
