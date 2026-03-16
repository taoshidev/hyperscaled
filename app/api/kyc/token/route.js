import { NextResponse } from "next/server";
import { isValidEvmAddress } from "@/lib/validation";
import {
  getUserByWallet,
  getApplicant,
  createApplicant,
  generateAccessToken,
  updateKycStatus,
} from "@/lib/sumsub";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { wallet } = body;

  if (!wallet || !isValidEvmAddress(wallet)) {
    return NextResponse.json(
      { error: "Invalid or missing wallet" },
      { status: 400 },
    );
  }

  try {
    const user = await getUserByWallet(wallet);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Register first." },
        { status: 404 },
      );
    }

    const externalUserId = wallet.toLowerCase();

    // Check if applicant already exists in SumSub
    let applicant = await getApplicant(externalUserId);

    if (!applicant) {
      applicant = await createApplicant(externalUserId, user.email);
      await updateKycStatus(wallet, {
        kycApplicantId: applicant.id,
        kycStatus: "pending",
      });
    }

    // Generate SDK access token
    const tokenData = await generateAccessToken(externalUserId);

    return NextResponse.json({
      token: tokenData.token,
      kycStatus: user.kycStatus,
    });
  } catch (err) {
    console.error("[kyc/token] Error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
