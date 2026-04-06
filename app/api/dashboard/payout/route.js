import { NextResponse } from "next/server";
import { STUB_ENABLED, stubPayout } from "@/lib/gateway-stubs";
import { reportCritical } from "@/lib/errors";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { subaccount_uuid, start_time_ms, end_time_ms } = body;

  if (!subaccount_uuid) {
    return NextResponse.json({ error: "Missing subaccount_uuid" }, { status: 400 });
  }

  if (STUB_ENABLED) {
    return NextResponse.json(stubPayout);
  }

  const validatorUrl = process.env.VALIDATOR_API_URL;
  const apiKey = process.env.VALIDATOR_API_KEY;

  if (!validatorUrl) {
    return NextResponse.json({ error: "Validator API not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${validatorUrl}/entity/subaccount/payout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ subaccount_uuid, start_time_ms, end_time_ms }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Validator returned ${res.status}` },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    reportCritical(err, { source: "api/dashboard/payout", message: "Could not reach validator" });
    return NextResponse.json({ error: "Could not reach validator" }, { status: 502 });
  }
}
