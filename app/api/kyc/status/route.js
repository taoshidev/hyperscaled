import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/validation";
import { getUserByWallet, getAuthorizedWalletsForHlAddress } from "@/lib/sumsub";
import { reportError } from "@/lib/errors";

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
    const [user, authorizedWallets] = await Promise.all([
      getUserByWallet(wallet),
      getAuthorizedWalletsForHlAddress(wallet),
    ]);

    if (!user) {
      return NextResponse.json({
        wallet: wallet.toLowerCase(),
        kycStatus: "none",
        verified: false,
        verifiedAt: null,
        authorizedWallets,
      });
    }

    return NextResponse.json({
      wallet: user.wallet,
      kycStatus: user.kycStatus,
      verified: user.kycStatus === "approved",
      verifiedAt: user.kycVerifiedAt,
      authorizedWallets,
    });
  } catch (err) {
    reportError(err, { source: "api/kyc/status" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
