import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/validation";
import { STUB_ENABLED } from "@/lib/gateway-stubs";
import { checkValidatorStatus } from "@/lib/validator";

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

  if (!process.env.VALIDATOR_API_URL) {
    return NextResponse.json({ error: "Validator API not configured" }, { status: 500 });
  }

  if (!process.env.VALIDATOR_API_KEY) {
    return NextResponse.json({ error: "Validator API key not configured" }, { status: 500 });
  }

  const { status } = await checkValidatorStatus(hlAddress);

  if (status === "unknown") {
    return NextResponse.json({ error: "Could not reach validator" }, { status: 502 });
  }

  return NextResponse.json({ status, hl_address: hlAddress });
}
