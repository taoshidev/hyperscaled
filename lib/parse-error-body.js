// Best-effort JSON parse for upstream error bodies (miner / facilitator).
// Storing the parsed object inside `registrations.status_detail` keeps the
// JSONB column queryable; falling back to the trimmed raw text avoids losing
// the message when the body isn't JSON. Returns `null` for empty/null input.
export function parseErrorBody(text) {
  if (text == null) return null;
  const t = String(text).trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
