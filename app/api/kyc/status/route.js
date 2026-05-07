import { NextResponse } from "next/server";

import { isValidEvmAddress } from "@/lib/validation";
import { getUserByWallet } from "@/lib/sumsub";
import { reportError } from "@/lib/errors";

/**
 * GET /api/kyc/status?wallet=0x…
 *
 * Public read of an account's KYC verification state. The response is
 * intended as a transparency signal (think "verified seller" badge) and
 * mirrors the public-by-default model used by the rest of the dashboard
 * endpoints.
 *
 * The list of wallets authorized to act on the account is deliberately
 * NOT exposed here — it's a sensitive bit (useful as a phishing target
 * list) and is enforced server-side in the write endpoints that need it
 * (e.g. /api/kyc/token).
 */
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
    reportError(err, { source: "api/kyc/status" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
