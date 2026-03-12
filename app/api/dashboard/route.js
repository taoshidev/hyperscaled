import { NextResponse } from "next/server";
import { resolveEndpointUrl } from "@/lib/gateway";
import { STUB_ENABLED, stubDashboard } from "@/lib/gateway-stubs";
import { isValidEvmAddress } from "@/lib/validation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hlAddress = searchParams.get("hl_address");

  // STUB: return fake dashboard data when gateway is offline
  if (STUB_ENABLED) {
    if (!hlAddress || !isValidEvmAddress(hlAddress)) {
      return NextResponse.json({ error: "Invalid or missing hl_address" }, { status: 400 });
    }
    return NextResponse.json(stubDashboard);
  }

  try {
    const { endpoint_url, hl_address } = await resolveEndpointUrl(hlAddress);
    const res = await fetch(
      `${endpoint_url}/api/hl/${hl_address}/dashboard`,
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Gateway returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
