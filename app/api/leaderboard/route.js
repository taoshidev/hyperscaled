import { NextResponse } from "next/server";
import { reportError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { registrations, entityMiners } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

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

    const regsWhere = entityHotkey
      ? and(eq(registrations.status, "registered"), eq(registrations.minerHotkey, entityHotkey))
      : eq(registrations.status, "registered");

    const [res, dbRegs] = await Promise.all([
      fetch(validatorLeaderboardUrl.toString()),
      getDb()
        .then((db) =>
          db.select({ hlAddress: registrations.hlAddress, accountSize: registrations.accountSize, createdAt: registrations.createdAt })
            .from(registrations)
            .where(regsWhere)
            .orderBy(registrations.createdAt)
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

    // Index registrations by lowercased hl_address so we can enrich validator
    // traders (and backfill missing ones) from our own signup record: the
    // registered account size as `funding`, and the registration date as
    // `sinceDate` — a real full date the validator's month+year string lacks.
    // Rows are ordered by created_at above, so the first seen per address is the
    // earliest registration.
    const regsByAddr = new Map();
    for (const r of dbRegs) {
      if (!r.hlAddress) continue;
      const key = r.hlAddress.toLowerCase();
      if (!regsByAddr.has(key)) regsByAddr.set(key, r);
    }

    const enrichFromRegistration = (traders) =>
      (traders || []).map((t) => {
        const reg = regsByAddr.get((t.address || t.addr || "").toLowerCase());
        if (!reg) return t;
        return {
          ...t,
          funding: t.funding != null ? t.funding : reg.accountSize,
          sinceDate: reg.createdAt ? new Date(reg.createdAt).toISOString() : t.sinceDate,
        };
      });

    data.fundedTraders = enrichFromRegistration(data.fundedTraders);
    data.challengeTraders = enrichFromRegistration(data.challengeTraders);

    const knownAddresses = new Set([
      ...(data.fundedTraders || []).map((t) => (t.address || t.addr || "").toLowerCase()),
      ...(data.challengeTraders || []).map((t) => (t.address || t.addr || "").toLowerCase()),
    ]);

    const missingTraders = dbRegs
      .filter((r) => r.hlAddress && !knownAddresses.has(r.hlAddress.toLowerCase()))
      .map((r) => {
        const d = new Date(r.createdAt);
        const since = d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric" });
        const sinceDate = d.toISOString();
        return {
          address: r.hlAddress,
          pnl: null,
          funding: r.accountSize,
          progress: null,
          sharpe: null,
          trades: 0,
          winRate: null,
          volume: 0,
          drawdown: null,
          since,
          sinceDate,
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
