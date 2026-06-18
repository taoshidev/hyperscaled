import { NextResponse } from "next/server";
import { reportError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { registrations, entityMiners } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request) {
  const validatorUrl = process.env.VALIDATOR_API_URL;
  if (!validatorUrl) {
    return NextResponse.json(
      { error: "Validator API not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brand_id");

  try {
    let entityHotkey = null;
    if (brandId) {
      const db = await getDb();
      const [row] = await db
        .select({ hotkey: entityMiners.hotkey })
        .from(entityMiners)
        .where(eq(entityMiners.slug, brandId.toLowerCase()))
        .limit(1);
      if (row) entityHotkey = row.hotkey;
    }

    const validatorLeaderboardUrl = new URL(`${validatorUrl}/hl-leaderboard`);
    if (entityHotkey) validatorLeaderboardUrl.searchParams.set("entity_hotkey", entityHotkey);

    const [res, dbRegs] = await Promise.all([
      fetch(validatorLeaderboardUrl.toString()),
      getDb()
        .then((db) =>
          db.select({ hlAddress: registrations.hlAddress, accountSize: registrations.accountSize, createdAt: registrations.createdAt })
            .from(registrations)
            .where(eq(registrations.status, "registered"))
        )
        .catch(() => []),
    ]);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Validator returned ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();

    // Add registered traders who haven't placed a trade yet
    const knownAddresses = new Set([
      ...(data.fundedTraders || []).map((t) => (t.address || t.addr || "").toLowerCase()),
      ...(data.challengeTraders || []).map((t) => (t.address || t.addr || "").toLowerCase()),
    ]);

    const missingTraders = dbRegs
      .filter((r) => r.hlAddress && !knownAddresses.has(r.hlAddress.toLowerCase()))
      .map((r) => {
        const d = new Date(r.createdAt);
        const since = d.toLocaleString("en-US", { month: "short", year: "numeric" });
        return {
          address: r.hlAddress,
          pnl: null,
          progress: null,
          sharpe: null,
          trades: 0,
          winRate: null,
          volume: 0,
          drawdown: null,
          since,
          noTrades: true,
        };
      });

    data.challengeTraders = [...(data.challengeTraders || []), ...missingTraders];
    if (data.summary) {
      data.summary.inChallenge = data.challengeTraders.length;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    reportError(err, { source: "api/leaderboard" });
    return NextResponse.json(
      { error: "Could not reach validator" },
      { status: 502 },
    );
  }
}
