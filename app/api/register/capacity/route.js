import { NextResponse } from "next/server";
import { getRegistrationCapacitySnapshot } from "@/lib/registration-capacity";
import { reportError } from "@/lib/errors";

// GET /api/register/capacity
// Public, browser-safe. Returns the current free/paid registration counts
// alongside the configured caps so the tier-selection UI can render a
// HubSpot waitlist when a cap is hit. No secrets are returned — `max` is
// `null` when the corresponding env cap is unset (i.e. unlimited).
export async function GET() {
  try {
    const snapshot = await getRegistrationCapacitySnapshot();
    const res = NextResponse.json(snapshot);
    // Short-cache so back-to-back tier-page loads don't hammer the DB,
    // but keep it fresh enough to hide the waitlist within a minute of
    // an op flipping the env cap up.
    res.headers.set("Cache-Control", "public, max-age=30, must-revalidate");
    return res;
  } catch (err) {
    console.error("[REGISTRATION] capacity snapshot failed", { error: err?.message });
    reportError(err, { source: "api/register/capacity" });
    // Fail open — better to let the user proceed and have the
    // server-side enforcement reject than to wedge the UI on a
    // transient DB blip.
    return NextResponse.json({
      free: { current: 0, max: null, atCapacity: false },
      paid: { current: 0, max: null, atCapacity: false },
    });
  }
}
