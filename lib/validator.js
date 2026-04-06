import { STUB_ENABLED } from "@/lib/gateway-stubs";

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

  const validatorUrl = process.env.VALIDATOR_API_URL;
  const apiKey = process.env.VALIDATOR_API_KEY;

  if (!validatorUrl || !apiKey) {
    return { status: "unknown" };
  }

  // Step 1: resolve synthetic_hotkey from hl_address
  let syntheticHotkey;
  try {
    const traderRes = await fetch(`${validatorUrl}/hl-traders/${hlAddress}`);
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
  } catch {
    return { status: "unknown" };
  }

  // Step 2: get subaccount status
  try {
    const subRes = await fetch(`${validatorUrl}/entity/subaccount/${syntheticHotkey}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!subRes.ok) {
      return { status: "unknown" };
    }
    const subData = await subRes.json();
    const status = subData?.dashboard?.subaccount_info?.status || "unknown";
    return { status };
  } catch {
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
