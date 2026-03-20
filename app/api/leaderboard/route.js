import { NextResponse } from "next/server";
import { reportError } from "@/lib/errors";

export async function GET() {
  const validatorUrl = process.env.VALIDATOR_API_URL;
  if (!validatorUrl) {
    return NextResponse.json(
      { error: "Validator API not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${validatorUrl}/hl-leaderboard`);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Validator returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    reportError(err, { source: "api/leaderboard" });
    return NextResponse.json(
      { error: "Could not reach validator" },
      { status: 502 },
    );
  }
}
