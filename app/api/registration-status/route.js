import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/validation";
import { STUB_ENABLED } from "@/lib/gateway-stubs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hlAddress = searchParams.get("hl_address");

  if (!hlAddress || !isValidEvmAddress(hlAddress)) {
    return NextResponse.json({ error: "Invalid or missing hl_address" }, { status: 400 });
  }

  // Stub mode for development
  if (STUB_ENABLED) {
    return NextResponse.json({ status: "active", hl_address: hlAddress });
  }

  const validatorUrl = process.env.VALIDATOR_API_URL;
  const apiKey = process.env.VALIDATOR_API_KEY;

  if (!validatorUrl) {
    return NextResponse.json({ error: "Validator API not configured" }, { status: 500 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "Validator API key not configured" }, { status: 500 });
  }

  // Step 1: GET /hl-traders/<hl_address> to get synthetic_hotkey
  let traderData;
  try {
    const traderRes = await fetch(`${validatorUrl}/hl-traders/${hlAddress}`);
    if (traderRes.status === 404) {
      return NextResponse.json({ status: "not_found", hl_address: hlAddress });
    }
    if (!traderRes.ok) {
      return NextResponse.json(
        { error: `Validator returned ${traderRes.status}` },
        { status: 502 },
      );
    }
    traderData = await traderRes.json();
  } catch {
    return NextResponse.json({ error: "Could not reach validator" }, { status: 502 });
  }

  const syntheticHotkey = traderData.synthetic_hotkey;
  if (!syntheticHotkey) {
    return NextResponse.json(
      { error: "No synthetic_hotkey returned from validator" },
      { status: 502 },
    );
  }

  // Step 2: GET /entity/subaccount/<synthetic_hotkey> with API key
  try {
    const subaccountRes = await fetch(
      `${validatorUrl}/entity/subaccount/${syntheticHotkey}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    if (!subaccountRes.ok) {
      return NextResponse.json(
        { error: `Subaccount lookup returned ${subaccountRes.status}` },
        { status: 502 },
      );
    }

    const subaccountData = await subaccountRes.json();
    const subaccountStatus =
      subaccountData?.dashboard?.subaccount_info?.status || "pending";

    return NextResponse.json({
      status: subaccountStatus,
      hl_address: hlAddress,
    });
  } catch {
    return NextResponse.json({ error: "Could not reach validator" }, { status: 502 });
  }
}
