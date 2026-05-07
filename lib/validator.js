import { STUB_ENABLED } from "@/lib/gateway-stubs";

// Sits on the preflight critical path. Without this cap, a slow/unreachable
// validator hangs the UI until the OS-level TCP timeout (~5min on macOS).
// `unknown` is the safe default so a short cap doesn't compromise correctness.
const VALIDATOR_FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, init = {}, timeoutMs = VALIDATOR_FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check whether an HL address is currently active on the validator.
 *
 * Two-step lookup:
 *   1. GET /hl-traders/<hl_address>  → extract synthetic_hotkey
 *   2. GET /entity/subaccount/<synthetic_hotkey> (Bearer)  → extract status
 *
 * Returns an object with a `status` field:
 *   "active"       — validator confirms the account is live
 *   "not_found"    — validator has no record of the address
 *   "failed"       — validator explicitly reports failure
 *   "eliminated"   — account was eliminated
 *   "pending"      — validator shows account is pending
 *   "<other>"      — any other status string returned by the validator
 *   "unknown"      — could not reach validator or env not configured
 *                    (treat as "still registered" — safe default)
 */
export async function checkValidatorStatus(hlAddress) {
  if (STUB_ENABLED) {
    return { status: "active" };
  }

  // E2E escape hatch — forces a deterministic status so the
  // stale-pending reconciliation path can be tested without a real
  // validator. Hard-throws if combined with NODE_ENV=production.
  const e2eFallback = process.env.E2E_VALIDATOR_FALLBACK_STATUS;
  if (e2eFallback) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "E2E_VALIDATOR_FALLBACK_STATUS is not permitted when NODE_ENV=production.",
      );
    }
    return { status: e2eFallback };
  }

  const validatorUrl = process.env.VALIDATOR_API_URL;
  const apiKey = process.env.VALIDATOR_API_KEY;

  if (!validatorUrl || !apiKey) {
    return { status: "unknown" };
  }

  // Step 1: resolve synthetic_hotkey from hl_address
  let syntheticHotkey;
  try {
    const traderRes = await fetchWithTimeout(`${validatorUrl}/hl-traders/${hlAddress}`);
    if (traderRes.status === 404) {
      return { status: "not_found" };
    }
    if (!traderRes.ok) {
      return { status: "unknown" };
    }
    const traderData = await traderRes.json();
    syntheticHotkey = traderData.dashboard?.subaccount_info?.synthetic_hotkey;
    if (!syntheticHotkey) {
      return { status: "not_found" };
    }
  } catch (err) {
    if (err?.name === "AbortError") {
      console.warn("[validator] /hl-traders timed out after", VALIDATOR_FETCH_TIMEOUT_MS, "ms", { hlAddress });
    }
    return { status: "unknown" };
  }

  // Step 2: get subaccount status
  try {
    const subRes = await fetchWithTimeout(`${validatorUrl}/entity/subaccount/${syntheticHotkey}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!subRes.ok) {
      return { status: "unknown" };
    }
    const subData = await subRes.json();
    const status = subData?.dashboard?.subaccount_info?.status || "unknown";
    return { status };
  } catch (err) {
    if (err?.name === "AbortError") {
      console.warn("[validator] /entity/subaccount timed out after", VALIDATOR_FETCH_TIMEOUT_MS, "ms", { syntheticHotkey });
    }
    return { status: "unknown" };
  }
}

/**
 * Returns true when the validator has confirmed this address is no longer active.
 * "unknown" is intentionally excluded — we only unlock when de-registration is confirmed.
 */
export function isConfirmedDeregistered(validatorStatus) {
  return ["not_found", "failed", "eliminated", "inactive", "deregistered"].includes(
    validatorStatus,
  );
}
