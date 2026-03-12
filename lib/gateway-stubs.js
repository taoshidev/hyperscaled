// Stub data for development when the trading gateway is not available.
// To go live: remove STUB_GATEWAY=true from .env.local

export const STUB_ENABLED = process.env.STUB_GATEWAY === "true";

export const stubStatus = {
  endpoint_url: "https://stub.gateway.local",
  hl_address: "0x0000000000000000000000000000000000000000",
  status: "active",
};

export const stubDashboard = {
  balance: {
    balance: 10000.0,
    effective_balance: 9875.5,
  },
  statistics: {
    all_time_return: 1.12,
    thirty_day_return: 1.04,
    win_rate: 0.62,
    total_trades: 47,
    avg_win: 215.3,
    avg_loss: -132.8,
    profit_factor: 1.85,
    sharpe_ratio: 1.42,
    max_drawdown: -0.08,
  },
  positions: {
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
  },
  limit_orders: [
    {
      pair: "BTC-PERP",
      order_type: "LIMIT_BUY",
      price: 65000.0,
      leverage: 3,
    },
  ],
  elimination: null,
};

export const stubEvents = [
  {
    pair: "BTC-PERP",
    order_type: "MARKET_BUY",
    status: "accepted",
    timestamp: Date.now() - 3600000,
  },
  {
    pair: "ETH-PERP",
    order_type: "MARKET_SELL",
    status: "accepted",
    timestamp: Date.now() - 7200000,
  },
  {
    pair: "SOL-PERP",
    order_type: "LIMIT_BUY",
    status: "rejected",
    error: "Insufficient margin",
    timestamp: Date.now() - 14400000,
  },
];
