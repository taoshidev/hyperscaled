export function mirrorRatio(accountSize, hlBalance) {
  const a = Number(accountSize);
  const b = Number(hlBalance);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return 0;
  return a / b;
}

export function scaleEquity(hlEquity, ratio) {
  const v = Number(hlEquity);
  const r = Number(ratio);
  if (!Number.isFinite(v) || !Number.isFinite(r)) return 0;
  return v * r;
}

export function scaleNotional(hlNotional, ratio) {
  return scaleEquity(hlNotional, ratio);
}

export function scalePnl(hlPnl, ratio) {
  return scaleEquity(hlPnl, ratio);
}

export function formatRatio(ratio) {
  const r = Number(ratio);
  if (!Number.isFinite(r) || r <= 0) return "—";
  if (r >= 10) return `${Math.round(r)}×`;
  if (r >= 1) return `${r.toFixed(1)}×`;
  return `${r.toFixed(2)}×`;
}
