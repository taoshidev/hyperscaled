// Transforms the new /hl-traders/<address> response (nested under `dashboard`)
// into a flat shape for frontend consumption.

export function transformTraderResponse(raw) {
  const d = raw.dashboard || {};
  const info = d.subaccount_info || {};
  const acctData = d.account_size_data || null;
  const dd = d.drawdown || null;
  const cp = d.challenge_period || null;
  const elim = d.elimination || null;
  const accountSize = acctData?.account_size ?? info.account_size ?? 0;

  // Transform positions from { uuid: {tp, t, o, r, ap, ...} } map to array
  let positions = null;
  if (d.positions) {
    const posMap = d.positions.positions || {};
    const posArray = Object.entries(posMap).map(([uuid, p]) => ({
      position_uuid: uuid,
      trade_pair: p.tp,
      position_type: p.t,
      open_ms: p.o,
      current_return: p.r,
      average_entry_price: p.ap,
      realized_pnl: p.rp,
      net_leverage: p.nl || 0,
      close_ms: p.c || null,
      return_at_close: p.rc || null,
      is_closed_position: !!p.c,
      filled_orders: p.fo
        ? Object.entries(p.fo).map(([oid, o]) => ({
            order_uuid: oid,
            order_type: o.t,
            value: o.v,
            execution_type: o.e,
            processed_ms: o.p,
            leverage: o.l,
            quantity: o.q,
            price: o.pr,
            limit_price: o.lp,
            stop_loss: o.sl,
            trailing_stop: o.tsl,
            take_profit: o.tk,
            stop_price: o.sp,
            stop_condition: o.cond,
          }))
        : [],
      unfilled_orders: p.uo || [],
      fee_history: p.fh || null,
      fees: p.fh
        ? Object.values(p.fh).reduce((sum, f) => sum + (f.a || 0), 0)
        : null,
    }));

    positions = {
      positions: posArray,
      positions_time_ms: d.positions.positions_time_ms,
      all_time_returns: d.positions.all_time_returns,
      total_leverage: d.positions.total_leverage,
    };
  }

  // Transform limit orders from map to array
  let limitOrders = null;
  if (d.limit_orders) {
    const openMap = d.limit_orders.open_orders || {};
    const openArray = Object.entries(openMap).map(([uuid, o]) => ({
      order_uuid: uuid,
      trade_pair: o.tp,
      order_type: o.t,
      value: o.v,
      execution_type: o.e,
      processed_ms: o.p,
      leverage: o.l,
      quantity: o.q,
      price: o.pr,
      limit_price: o.lp,
      stop_loss: o.sl,
      trailing_stop: o.tsl,
      take_profit: o.tk,
      stop_price: o.sp,
      stop_condition: o.cond,
    }));
    limitOrders = {
      open_orders: openArray,
      closed_orders: d.limit_orders.closed_orders || [],
      limit_orders_time_ms: d.limit_orders.limit_orders_time_ms,
    };
  }

  // Compute derived drawdown fields (thresholds are fractions, convert to pct)
  let drawdown = null;
  if (dd) {
    const intradayThresholdPct = (dd.intraday_drawdown_threshold || 0) * 100;
    const eodThresholdPct = (dd.eod_drawdown_threshold || 0) * 100;
    const intradayUsagePct =
      intradayThresholdPct > 0
        ? (dd.intraday_drawdown_pct / intradayThresholdPct) * 100
        : 0;
    const eodUsagePct =
      eodThresholdPct > 0
        ? (dd.eod_drawdown_pct / eodThresholdPct) * 100
        : 0;
    drawdown = {
      current_equity: dd.current_equity,
      daily_open_equity: dd.daily_open_equity,
      eod_hwm: dd.eod_hwm,
      last_eod_equity: dd.last_eod_equity,
      intraday_drawdown_pct: dd.intraday_drawdown_pct,
      eod_drawdown_pct: dd.eod_drawdown_pct,
      intraday_drawdown_threshold: dd.intraday_drawdown_threshold,
      eod_drawdown_threshold: dd.eod_drawdown_threshold,
      // Computed convenience fields
      intraday_threshold_pct: intradayThresholdPct,
      eod_threshold_pct: eodThresholdPct,
      intraday_usage_pct: intradayUsagePct,
      eod_usage_pct: eodUsagePct,
    };
  }

  return {
    status: raw.status,
    timestamp: raw.timestamp,
    // From subaccount_info
    synthetic_hotkey: info.synthetic_hotkey,
    subaccount_uuid: info.subaccount_uuid,
    subaccount_id: info.subaccount_id,
    asset_class: info.asset_class,
    account_size: accountSize,
    subaccount_status: info.status,
    created_at_ms: info.created_at_ms,
    eliminated_at_ms: info.eliminated_at_ms,
    hl_address: info.hl_address,
    payout_address: info.payout_address,
    // Sections
    challenge_period: cp,
    drawdown,
    elimination: elim,
    account_size_data: acctData,
    positions,
    limit_orders: limitOrders,
  };
}
