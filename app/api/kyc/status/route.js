import { NextResponse } from "next/server";

import { isValidEvmAddress } from "@/lib/validation";
import {
  getUserByWallet,
  getApplicant,
  updateKycStatus,
} from "@/lib/sumsub";
import { reportError } from "@/lib/errors";

/**
 * Best-effort reconciliation for users stuck on `pending`: if a review webhook
 * was missed (e.g. transient DB outage), pull the live applicant review from
 * SumSub and persist any terminal result. Returns the reconciled fields, or
 * null to keep the stored value. Never throws — a read must not depend on
 * SumSub being reachable.
 */
async function reconcilePendingKyc(wallet) {
  try {
    const applicant = await getApplicant(wallet.toLowerCase());
    const result =
      applicant?.review?.reviewResult ?? applicant?.reviewResult ?? null;
    const answer = result?.reviewAnswer;
    if (answer === "GREEN") {
      const kycVerifiedAt = new Date();
      await updateKycStatus(wallet, { kycStatus: "approved", kycVerifiedAt });
      return { kycStatus: "approved", kycVerifiedAt };
    }
    if (answer === "RED") {
      await updateKycStatus(wallet, { kycStatus: "rejected" });
      return { kycStatus: "rejected", kycVerifiedAt: null };
    }
  } catch (err) {
    reportError(err, {
      source: "api/kyc/status",
      metadata: { step: "reconcile" },
    });
  }
  return null;
}

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

    let kycStatus = user.kycStatus;
    let verifiedAt = user.kycVerifiedAt;

    if (kycStatus === "pending") {
      const reconciled = await reconcilePendingKyc(user.wallet);
      if (reconciled) {
        kycStatus = reconciled.kycStatus;
        verifiedAt = reconciled.kycVerifiedAt;
      }
    }

    return NextResponse.json({
      wallet: user.wallet,
      kycStatus,
      verified: kycStatus === "approved",
      verifiedAt,
    });
  } catch (err) {
    reportError(err, { source: "api/kyc/status" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
