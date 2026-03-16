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
  positions: {
    positions: [
      {
        trade_pair: ["BTCUSD", "BTC/USD", 0.01, 0.001, 0.5],
        position_type: "LONG",
        average_entry_price: 67500.0,
        net_leverage: 0.3,
        unrealized_pnl: 325.5,
        current_return: 1.032,
        is_closed_position: false,
        open_ms: Date.now() - 86400000 * 2,
        close_ms: 0,
      },
      {
        trade_pair: ["ETHUSD", "ETH/USD", 0.01, 0.001, 0.5],
        position_type: "SHORT",
        average_entry_price: 3450.0,
        net_leverage: -0.5,
        unrealized_pnl: -48.2,
        current_return: 0.986,
        is_closed_position: false,
        open_ms: Date.now() - 86400000,
        close_ms: 0,
      },
      {
        trade_pair: ["SOLUSD", "SOL/USD", 0.01, 0.001, 0.5],
        position_type: "FLAT",
        average_entry_price: 142.5,
        net_leverage: 0.0,
        realized_pnl: 187.3,
        return_at_close: 1.045,
        current_return: 1.045,
        is_closed_position: true,
        open_ms: Date.now() - 86400000 * 3,
        close_ms: Date.now() - 86400000,
      },
      {
        trade_pair: ["ETHUSD", "ETH/USD", 0.01, 0.001, 0.5],
        position_type: "FLAT",
        average_entry_price: 3200.0,
        net_leverage: 0.0,
        realized_pnl: -95.0,
        return_at_close: 0.97,
        current_return: 0.97,
        is_closed_position: true,
        open_ms: Date.now() - 86400000 * 5,
        close_ms: Date.now() - 86400000 * 4,
      },
    ],
    thirty_day_returns: 1.032,
    all_time_returns: 1.045,
    n_positions: 2,
    percentage_profitable: 0.5,
    total_leverage: 0.8,
  },
  drawdown: {
    ledger_max_drawdown: 0.955,
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
