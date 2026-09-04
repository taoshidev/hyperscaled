/**
 * Pure helpers shared by the retry library, the Command Center client
 * components and tests. No server imports here — this file is bundled into
 * the browser.
 */

/** Normalise a parsed miner error (string | {message|error} | anything) to text. */
export function errorText(err) {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    if (typeof err.message === "string" && err.message) return err.message;
    if (typeof err.error === "string" && err.error) return err.error;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

/** Human-readable one-liner for a retry result row. */
export function describeRetryResult(result) {
  if (!result) return "";
  const err = errorText(result.error);
  switch (result.status) {
    case "registered":
      return "Registered";
    case "failed":
      return `Failed: HL address already registered at the miner${err ? ` (${err})` : ""}`;
    case "still_pending":
      if (result.reason === "miner_api_unreachable") {
        return `Still pending: miner unreachable${err ? ` (${err})` : ""}`;
      }
      return `Still pending: miner returned ${result.apiStatus ?? "an error"}${err ? ` — ${err}` : ""}`;
    case "skipped":
      if (result.reason === "handled_elsewhere") return "Already handled by another retry run";
      if (result.reason === "miner_unreachable_this_run") return "Skipped: miner was unreachable earlier in this run";
      return "Skipped: the row's miner has no API URL configured";
    case "db_error":
      return `Not recorded: database write failed${err ? ` (${err})` : ""}`;
    default:
      return String(result.status);
  }
}

/** "3 registered · 1 still pending" style summary for a batch run. */
export function summarizeRetryResults(results) {
  const counts = { registered: 0, still_pending: 0, failed: 0, skipped: 0, db_error: 0 };
  for (const r of results ?? []) {
    if (Object.hasOwn(counts, r.status)) counts[r.status] += 1;
  }
  const parts = [];
  if (counts.registered) parts.push(`${counts.registered} registered`);
  if (counts.still_pending) parts.push(`${counts.still_pending} still pending`);
  if (counts.failed) parts.push(`${counts.failed} failed`);
  if (counts.skipped) parts.push(`${counts.skipped} skipped`);
  if (counts.db_error) parts.push(`${counts.db_error} not recorded`);
  return parts.length ? parts.join(" · ") : "Nothing to retry";
}
