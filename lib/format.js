export function formatUSD(value) {
  const num = Number(value);
  if (isNaN(num)) return "$0.00";
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPrice(value) {
  const num = Number(value);
  if (isNaN(num)) return "$0.00";
  const abs = Math.abs(num);
  const fractionDigits = abs < 1 ? 5 : abs < 100 ? 4 : 2;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatReturn(value) {
  const num = Number(value);
  if (isNaN(num)) return "0.00%";
  const pct = (num - 1) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatPercent(value) {
  const num = Number(value);
  if (isNaN(num)) return "0.0%";
  return `${(num * 100).toFixed(1)}%`;
}

export function formatLeverage(value) {
  const num = Number(value);
  if (isNaN(num)) return "0.00x";
  return `${Math.abs(num).toFixed(2)}x`;
}

export function formatTime(ms) {
  const date = new Date(ms);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatLabel(snakeCase) {
  if (!snakeCase) return "";
  return snakeCase
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function pnlColor(value) {
  return Number(value) >= 0 ? "text-green-400" : "text-red-400";
}

export function formatAccountSize(size) {
  return `$${size.toLocaleString("en-US")}`;
}

export function truncateAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
