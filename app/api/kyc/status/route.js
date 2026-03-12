import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/validation";
import { getUserByWallet } from "@/lib/sumsub";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet || !isValidEvmAddress(wallet)) {
    return NextResponse.json(
      { error: "Invalid or missing wallet" },
      { status: 400 },
    );
  }

  try {
    const user = await getUserByWallet(wallet);

    if (!user) {
      return NextResponse.json({
        wallet: wallet.toLowerCase(),
        kycStatus: "none",
        verified: false,
        verifiedAt: null,
      });
    }

    return NextResponse.json({
      wallet: user.wallet,
      kycStatus: user.kycStatus,
      verified: user.kycStatus === "approved",
      verifiedAt: user.kycVerifiedAt,
    });
  } catch (err) {
    console.error("[kyc/status] Error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
