import { NextResponse } from "next/server";

import { STUB_ENABLED, stubPayout } from "@/lib/gateway-stubs";
import { reportCritical } from "@/lib/errors";
import { isValidHLAddress } from "@/lib/validation";
import { parseErrorBody } from "@/lib/parse-error-body";

/**
 * POST /api/dashboard/payout
 *
 * Public read of a subaccount's payout history. Matches the public-by-default
 * model used by the rest of the dashboard endpoints (`/api/dashboard`,
 * `/api/dashboard/events`, `/api/dashboard/stream`).
 *
 * Body: { subaccount_uuid, hl_address, start_time_ms, end_time_ms }
 *
 * The validator enforces a deterministic time grid:
 *   - start_time_ms must be Monday 00:00:00 UTC
 *   - end_time_ms   must be a 12-hour boundary (00:00 or 12:00 UTC)
 *
 * The frontend uses `lib/payout-window.js` to snap timestamps before sending.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { subaccount_uuid, hl_address, start_time_ms, end_time_ms } = body;

  if (!subaccount_uuid) {
    return NextResponse.json(
      { error: "Missing subaccount_uuid" },
      { status: 400 },
    );
  }
  if (!hl_address || !isValidHLAddress(hl_address)) {
    return NextResponse.json(
      { error: "Missing or invalid hl_address (must be the trader's HL address)" },
      { status: 400 },
    );
  }

  if (STUB_ENABLED) {
    return NextResponse.json(stubPayout);
  }

  const validatorUrl = process.env.VALIDATOR_API_URL;
  const apiKey = process.env.VALIDATOR_API_KEY;

  if (!validatorUrl) {
    return NextResponse.json(
      { error: "Validator API not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${validatorUrl}/entity/subaccount/payout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        subaccount_uuid,
        hl_address,
        start_time_ms,
        end_time_ms,
      }),
    });

    if (!res.ok) {
      const rawBody = await res.text().catch(() => "");
      const parsed = parseErrorBody(rawBody);
      const detail =
        parsed && typeof parsed === "object" && parsed.error
          ? parsed.error
          : typeof parsed === "string" && parsed
            ? parsed
            : `status ${res.status}`;

      // The validator returns 404 ("Subaccount … not found or has no debt
      // ledger data") for both genuinely unknown UUIDs AND for legitimate
      // brand-new subaccounts that simply have no checkpoints yet. The
      // two cases are indistinguishable from this endpoint, so we treat
      // a 404 as "no payout history" and return an empty-success
      // payload. The component already handles empty checkpoint lists,
      // so the UI shows a graceful zero-state instead of an error.
      if (res.status === 404) {
        return NextResponse.json({
          status: "success",
          data: { payout: 0, checkpoints: [], total_checkpoints: 0 },
          timestamp: Date.now(),
        });
      }

      // Anything else (alignment errors, validator 5xx, etc.) is still
      // an error. Forward the validator's structured reason verbatim so
      // the client / operator can see it.
      console.warn("[dashboard/payout] validator rejected request", {
        status: res.status,
        detail,
        subaccount_uuid,
        hl_address,
      });

      return NextResponse.json(
        { error: `Validator: ${detail}`, validatorStatus: res.status },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    reportCritical(err, {
      source: "api/dashboard/payout",
      message: "Could not reach validator",
    });
    return NextResponse.json(
      { error: "Could not reach validator" },
      { status: 502 },
    );
  }
}
