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
  return `${num.toFixed(2)}x`;
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
