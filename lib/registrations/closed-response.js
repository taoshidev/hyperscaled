import { NextResponse } from "next/server";
import {
  REGISTRATIONS_CLOSED_CODE,
  REGISTRATIONS_CLOSED_MESSAGE,
  VANTA_TRADING_URL,
} from "@/lib/sunset";

// Only for a checkout that already sent a Hyperliquid transfer before the
// sunset deploy — mirrors the route's other post-payment failure wording.
const PAYMENT_SENT_SUFFIX =
  " If you already sent a payment, please contact support with your transaction hash.";

// 410 Gone: the registration resource is permanently retired (Notion #1560).
// The SDK/CLI surfaces the raw body on any non-402 probe, so `error` must read
// as a complete, user-facing sentence.
export function registrationsClosedResponse({ paymentSent = false } = {}) {
  return NextResponse.json(
    {
      error: paymentSent
        ? `${REGISTRATIONS_CLOSED_MESSAGE}${PAYMENT_SENT_SUFFIX}`
        : REGISTRATIONS_CLOSED_MESSAGE,
      code: REGISTRATIONS_CLOSED_CODE,
      url: VANTA_TRADING_URL,
    },
    { status: 410 },
  );
}
