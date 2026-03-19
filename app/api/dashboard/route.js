import { NextResponse } from "next/server";
import { STUB_ENABLED, stubDashboard } from "@/lib/gateway-stubs";
import { isValidEvmAddress } from "@/lib/validation";
import { reportCritical } from "@/lib/errors";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hlAddress = searchParams.get("hl_address");

  if (!hlAddress || !isValidEvmAddress(hlAddress)) {
    return NextResponse.json(
      { error: "Invalid or missing hl_address" },
      { status: 400 },
    );
  }

  if (STUB_ENABLED) {
    return NextResponse.json(stubDashboard);
  }

  const validatorUrl = process.env.VALIDATOR_API_URL;
  if (!validatorUrl) {
    return NextResponse.json(
      { error: "Validator API not configured" },
      { status: 500 },
    );
  }

  try {
    const [traderRes, limitsRes] = await Promise.all([
      fetch(`${validatorUrl}/hl-traders/${hlAddress}`),
      fetch(`${validatorUrl}/hl-traders/${hlAddress}/limits`),
    ]);

    if (traderRes.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!traderRes.ok) {
      return NextResponse.json(
        { error: `Validator returned ${traderRes.status}` },
        { status: 502 },
      );
    }

    const trader = await traderRes.json();
    const limits = limitsRes.ok ? await limitsRes.json() : null;

    return NextResponse.json({ ...trader, limits }, { status: 200 });
  } catch (err) {
    reportCritical(err, { source: "api/dashboard", userId: hlAddress, message: "Could not reach validator" });
    return NextResponse.json(
      { error: "Could not reach validator" },
      { status: 502 },
    );
  }
}
