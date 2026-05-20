import { USDC_DECIMALS } from "@/lib/constants";

const USDC_SCALE = 10 ** USDC_DECIMALS;

export function toUsdcAtomicString(usdAmount) {
  const n = Number(usdAmount);
  if (!Number.isFinite(n) || n < 0) {
    throw new RangeError(
      `toUsdcAtomicString: expected non-negative finite USD amount, got ${usdAmount}`,
    );
  }
  return String(Math.round(n * USDC_SCALE));
}

export function toUsdcDecimalString(usdAmount) {
  const n = Number(usdAmount);
  if (!Number.isFinite(n) || n < 0) {
    throw new RangeError(
      `toUsdcDecimalString: expected non-negative finite USD amount, got ${usdAmount}`,
    );
  }
  return (Math.round(n * 100) / 100).toFixed(2);
}
