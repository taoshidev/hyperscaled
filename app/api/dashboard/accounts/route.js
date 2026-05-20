import { NextResponse } from "next/server";
import { and, desc, eq, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { entityMiners, registrations } from "@/lib/db/schema";
import { isValidEvmAddress } from "@/lib/validation";
import { reportError } from "@/lib/errors";
import { checkRateLimit, getTrustedClientId } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ACCOUNTS_LOOKUP_LIMIT = 60;
const ACCOUNTS_LOOKUP_WINDOW_MS = 60_000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const walletParam = searchParams.get("wallet");
  const minerParam = searchParams.get("miner");

  if (!walletParam || !isValidEvmAddress(walletParam)) {
    return NextResponse.json(
      { error: "Invalid or missing wallet" },
      { status: 400 },
    );
  }

  const wallet = walletParam.toLowerCase();

  const trustedIp = getTrustedClientId(request);
  const limiterKey = trustedIp
    ? `dashboard-accounts:ip:${trustedIp}`
    : `dashboard-accounts:wallet:${wallet}`;
  const rl = await checkRateLimit({
    key: limiterKey,
    limit: ACCOUNTS_LOOKUP_LIMIT,
    windowMs: ACCOUNTS_LOOKUP_WINDOW_MS,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000) || 1),
        },
      },
    );
  }

  try {
    const db = await getDb();

    const conditions = [
      or(
        sql`lower(${registrations.hlAddress}) = ${wallet}`,
        sql`lower(${registrations.payerAddress}) = ${wallet}`,
      ),
    ];

    if (minerParam) {
      const [miner] = await db
        .select({ hotkey: entityMiners.hotkey })
        .from(entityMiners)
        .where(eq(entityMiners.slug, minerParam))
        .limit(1);
      if (!miner) {
        return NextResponse.json({ accounts: [] });
      }
      conditions.push(eq(registrations.minerHotkey, miner.hotkey));
    }

    const rows = await db
      .select({
        id: registrations.id,
        hlAddress: registrations.hlAddress,
        payerAddress: registrations.payerAddress,
        accountSize: registrations.accountSize,
        tierIndex: registrations.tierIndex,
        status: registrations.status,
        createdAt: registrations.createdAt,
        minerHotkey: registrations.minerHotkey,
        minerSlug: entityMiners.slug,
        minerName: entityMiners.name,
      })
      .from(registrations)
      .leftJoin(entityMiners, eq(entityMiners.hotkey, registrations.minerHotkey))
      .where(and(...conditions))
      .orderBy(desc(registrations.createdAt));

    const byHl = new Map();
    for (const row of rows) {
      const hl = String(row.hlAddress || "").toLowerCase();
      if (!hl) continue;
      if (byHl.has(hl)) continue;

      const isOwner = hl === wallet;
      const isPayer =
        row.payerAddress &&
        String(row.payerAddress).toLowerCase() === wallet;

      byHl.set(hl, {
        hlAddress: hl,
        accountSize: row.accountSize,
        tierIndex: row.tierIndex,
        status: row.status,
        registeredAt: row.createdAt,
        minerSlug: row.minerSlug,
        minerName: row.minerName,
        role: isOwner && isPayer ? "both" : isOwner ? "owner" : "payer",
      });
    }

    return NextResponse.json({ accounts: Array.from(byHl.values()) });
  } catch (err) {
    await reportError(err, {
      source: "api/dashboard/accounts",
      metadata: { wallet, miner: minerParam },
    });
    return NextResponse.json(
      { error: "Failed to look up linked accounts" },
      { status: 500 },
    );
  }
}
