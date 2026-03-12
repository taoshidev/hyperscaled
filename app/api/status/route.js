import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/validation";
import { STUB_ENABLED, stubStatus } from "@/lib/gateway-stubs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hlAddress = searchParams.get("hl_address");

  if (!hlAddress || !isValidEvmAddress(hlAddress)) {
    return NextResponse.json(
      { error: "Invalid or missing hl_address" },
      { status: 400 },
    );
  }

  // STUB: return fake status when gateway is offline
  if (STUB_ENABLED) {
    return NextResponse.json({ ...stubStatus, hl_address: hlAddress });
  }

  const validatorUrl = process.env.VALIDATOR_API_URL;
  if (!validatorUrl) {
    return NextResponse.json(
      { error: "Validator API not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(
      `${validatorUrl}/entity/endpoint?hl_address=${hlAddress}`,
    );

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 200 });
    }

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: `Validator returned ${res.status}` },
      { status: 502 },
    );
  } catch (err) {
    console.error("[status] Validator API unreachable:", err.message);
    return NextResponse.json(
      { error: "Could not reach validator" },
      { status: 502 },
    );
  }
}
