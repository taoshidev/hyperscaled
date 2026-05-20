import { NextResponse } from "next/server";
import { getRegistrationCapacitySnapshot } from "@/lib/registration-capacity";
import { reportError } from "@/lib/errors";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const miner = searchParams.get("miner") || searchParams.get("minerSlug");
    const minerSlug =
      typeof miner === "string" && miner.trim() ? miner.trim() : undefined;

    const snapshot = await getRegistrationCapacitySnapshot(
      minerSlug ? { minerSlug } : {},
    );
    const res = NextResponse.json(snapshot);
    res.headers.set("Cache-Control", "public, max-age=30, must-revalidate");
    return res;
  } catch (err) {
    console.error("[REGISTRATION] capacity snapshot failed", { error: err?.message });
    reportError(err, { source: "api/register/capacity" });
    return NextResponse.json({
      free: { current: 0, max: null, atCapacity: false },
      paid: { current: 0, max: null, atCapacity: false },
    });
  }
}
