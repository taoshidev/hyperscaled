import { NextResponse } from "next/server";
import { verifyWebhookSignature, updateKycStatus } from "@/lib/sumsub";

export async function POST(request) {
  const rawBody = await request.text();
  const digest = request.headers.get("x-payload-digest");

  if (!digest || !verifyWebhookSignature(rawBody, digest)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, externalUserId, reviewResult } = payload;

  if (!externalUserId) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (type === "applicantReviewed") {
      const answer = reviewResult?.reviewAnswer;
      if (answer === "GREEN") {
        await updateKycStatus(externalUserId, {
          kycStatus: "approved",
          kycVerifiedAt: new Date(),
        });
      } else if (answer === "RED") {
        await updateKycStatus(externalUserId, {
          kycStatus: "rejected",
        });
      }
    } else if (type === "applicantPending") {
      await updateKycStatus(externalUserId, {
        kycStatus: "pending",
      });
    }
    // Other event types are acknowledged but ignored
  } catch (err) {
    console.error("[kyc/webhook] Error processing event:", err.message);
  }

  return NextResponse.json({ ok: true });
}
