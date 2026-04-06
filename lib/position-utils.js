/**
 * Estimate unrealized PnL (USD) for an open position from validator fields:
 * - current_return (multiplier, fees excluded)
 * - net_leverage
 * - account_size_data.capital_used
 */
export function openPositionUnrealizedUsd(position, openPositions, accountSizeData) {
  const capUsed = accountSizeData?.capital_used;
  if (capUsed == null || capUsed <= 0 || !Array.isArray(openPositions)) {
    return null;
  }

  const r = Number(position.current_return);
  if (Number.isNaN(r)) return null;

  const levSum = openPositions.reduce((s, p) => {
    const l = Math.abs(Number(p.net_leverage ?? p.leverage) || 0);
    return s + l;
  }, 0);
  if (levSum <= 0) {
    const equalShare = capUsed / openPositions.length;
    return (r - 1) * equalShare;
  }

  const lev = Math.abs(Number(position.net_leverage ?? position.leverage) || 0);
  const share = lev / levSum;
  return (r - 1) * capUsed * share;
}

export function openPositionsUnrealizedTotalUsd(positions, accountSizeData) {
  const all = Array.isArray(positions) ? positions : positions?.positions || [];
  const open = all.filter((p) => !p.is_closed_position);
  if (open.length === 0) return 0;

  return open.reduce((sum, p) => {
    const unrealized = openPositionUnrealizedUsd(p, open, accountSizeData);
    return sum + (Number.isFinite(unrealized) ? unrealized : 0);
  }, 0);
}
