import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/validation";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !isValidEvmAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  // Fetch both clearinghouse state and spot balances in parallel
  let clearinghouseRes, spotRes;
  try {
    [clearinghouseRes, spotRes] = await Promise.all([
      fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clearinghouseState", user: address }),
        next: { revalidate: 0 },
      }),
      fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "spotClearinghouseState", user: address }),
        next: { revalidate: 0 },
      }),
    ]);
  } catch {
    return NextResponse.json({ error: "Could not reach Hyperliquid" }, { status: 502 });
  }

  if (!clearinghouseRes.ok) {
    return NextResponse.json({ error: `HL API returned ${clearinghouseRes.status}` }, { status: 502 });
  }

  const clearinghouseData = await clearinghouseRes.json();
  const perpAccountValue = parseFloat(clearinghouseData.crossMarginSummary?.accountValue ?? 0);
  const perpMarginUsed = parseFloat(clearinghouseData.crossMarginSummary?.totalMarginUsed ?? 0);
  const perpAvailable = Math.max(0, perpAccountValue - perpMarginUsed);

  // Get available spot USDC (total minus hold, which is committed to perp margin)
  let spotUsdcBalance = 0;
  if (spotRes.ok) {
    const spotData = await spotRes.json();
    const balances = spotData.balances || [];
    for (const balance of balances) {
      if (balance.coin === "USDC" || balance.token === 0) {
        const total = parseFloat(balance.total ?? 0);
        const hold = parseFloat(balance.hold ?? 0);
        spotUsdcBalance = total - hold;
        break;
      }
    }
  }

  const accountValue = perpAvailable + spotUsdcBalance;

  return NextResponse.json({ accountValue, perpAccountValue, perpAvailable, spotUsdcBalance, address });
}
