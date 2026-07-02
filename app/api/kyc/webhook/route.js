import { NextResponse } from "next/server";
import { verifyWebhookSignature, updateKycStatus } from "@/lib/sumsub";
import { reportError, reportWarning } from "@/lib/errors";

// hyperscaled keys KYC by wallet. The SumSub project is shared with other apps
// (vanta-ui / hyperscaled-api) that key applicants by a UUID externalUserId;
// those events are delivered here too but are NOT ours. Match only 0x wallets
// so we never run `UPDATE users ... WHERE wallet = '<uuid>'`.
const WALLET_RE = /^0x[0-9a-fA-F]{40}$/;

export async function POST(request) {
  const rawBody = await request.text();
  const digest = request.headers.get("x-payload-digest");
  const digestAlg = request.headers.get("x-payload-digest-alg");

  if (!digest || !verifyWebhookSignature(rawBody, digest, digestAlg)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, externalUserId, reviewResult } = payload;

  // Acknowledge (200) events that aren't ours: missing externalUserId or a
  // non-wallet (UUID) id from a sibling app on the shared SumSub project.
  if (!externalUserId || !WALLET_RE.test(externalUserId)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    let affected = 0;
    let handled = true;

    switch (type) {
      case "applicantReviewed": {
        const answer = reviewResult?.reviewAnswer;
        if (answer === "GREEN") {
          affected = await updateKycStatus(externalUserId, {
            kycStatus: "approved",
            kycVerifiedAt: new Date(),
          });
        } else if (answer === "RED") {
          affected = await updateKycStatus(externalUserId, {
            kycStatus: "rejected",
          });
        } else {
          handled = false;
        }
        break;
      }
      case "applicantPending":
      case "applicantOnHold":
      case "applicantReset": {
        affected = await updateKycStatus(externalUserId, {
          kycStatus: "pending",
        });
        break;
      }
      default:
        // Other event types (applicantCreated, applicantPrechecked, …) are
        // acknowledged but need no state change.
        handled = false;
        break;
    }

    // A handled event that touched zero rows means the wallet has no user row
    // yet. Surface it (warning, not error) so silent no-ops are visible.
    if (handled && affected === 0) {
      reportWarning("KYC webhook matched no user", {
        source: "api/kyc/webhook",
        metadata: { eventType: type },
      });
    }
  } catch (err) {
    // Return 500 so SumSub retries. Swallowing the error as 200 (the old
    // behavior) let a transient DB failure permanently strand the user on
    // "pending" because the review result was never persisted.
    reportError(err, {
      source: "api/kyc/webhook",
      metadata: { eventType: type },
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
