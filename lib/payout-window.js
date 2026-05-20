/**
 * The validator's `/entity/subaccount/payout` endpoint enforces a
 * deterministic time grid:
 *
 *   - `start_time_ms` MUST be Monday 00:00:00 UTC
 *   - `end_time_ms`   MUST be a 12-hour boundary (00:00 or 12:00 UTC)
 *
 * Sending raw `Date.now()` deltas trips the alignment check and
 * produces a 400 every call. This helper snaps both ends of the
 * window to the validator's grid. We default to "previous 4 full
 * weeks" which is wide enough to cover most checkpoint cadences
 * without being so wide it hurts validator response time.
 */
export const PAYOUT_WINDOW_WEEKS = 4;

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;

/**
 * Snap a timestamp back to the most recent Monday 00:00:00 UTC at or
 * before it. JS `getUTCDay()` returns 0 for Sunday, 1 for Monday, … so
 * we offset by `(day + 6) % 7` to land on Monday.
 */
export function mondayUtcAtOrBefore(ms) {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  const offsetDays = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.getTime();
}

/**
 * Snap a timestamp back to the most recent 12-hour boundary at or
 * before it (00:00 or 12:00 UTC).
 */
export function twelveHourBoundaryAtOrBefore(ms) {
  const d = new Date(ms);
  d.setUTCMinutes(0, 0, 0);
  if (d.getUTCHours() >= 12) {
    d.setUTCHours(12);
  } else {
    d.setUTCHours(0);
  }
  return d.getTime();
}

/**
 * Build a validator-aligned payout window ending at the most recent
 * 12-hour boundary at-or-before `nowMs` and starting `weeks` Mondays
 * before that.
 */
export function buildPayoutWindow(nowMs, weeks = PAYOUT_WINDOW_WEEKS) {
  const endMs = twelveHourBoundaryAtOrBefore(nowMs);
  // Use the Monday at-or-before `endMs` as the anchor, then walk back
  // `weeks` whole weeks. This keeps the window length stable regardless
  // of which day the call lands on.
  const anchorMonday = mondayUtcAtOrBefore(endMs);
  const startMs = anchorMonday - weeks * 7 * MS_PER_DAY;
  return { startMs, endMs };
}

// Re-exported for tests that want to assert the constants are honored.
export const _internal = { MS_PER_DAY, MS_PER_HOUR };
