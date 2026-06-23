import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { STUB_ENABLED, stubDashboard } from "@/lib/gateway-stubs";
import { isValidEvmAddress } from "@/lib/validation";
import { reportCritical } from "@/lib/errors";
import { transformTraderResponse } from "@/lib/transform-trader";
import { getDb } from "@/lib/db";
import { entityMiners, registrations } from "@/lib/db/schema";

async function findPendingRegistration(hlAddress) {
  try {
    const db = await getDb();
    const [row] = await db
      .select({
        accountSize: registrations.accountSize,
        createdAt: registrations.createdAt,
        payoutAddress: registrations.payoutAddress,
        minerSlug: entityMiners.slug,
      })
      .from(registrations)
      .leftJoin(entityMiners, eq(entityMiners.hotkey, registrations.minerHotkey))
      .where(
        and(
          sql`lower(${registrations.hlAddress}) = ${hlAddress.toLowerCase()}`,
          eq(registrations.status, "registered"),
        ),
      )
      .orderBy(desc(registrations.createdAt))
      .limit(1);
    return row || null;
  } catch {
    return null;
  }
}

function buildPendingTraderPayload(hlAddress, reg) {
  return {
    status: "success",
    timestamp: Date.now(),
    subaccount_status: "pending_first_trade",
    hl_address: hlAddress,
    payout_address: reg.payoutAddress || null,
    account_size: reg.accountSize ?? 0,
    created_at_ms: reg.createdAt ? new Date(reg.createdAt).getTime() : null,
    miner_slug: reg.minerSlug || null,
    synthetic_hotkey: null,
    subaccount_uuid: null,
    subaccount_id: null,
    asset_class: null,
    eliminated_at_ms: null,
    challenge_period: null,
    drawdown: null,
    elimination: null,
    account_size_data: null,
    positions: null,
    limit_orders: null,
    limits: null,
    statistics: null,
    quarterly_pnl: null,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hlAddress = searchParams.get("hl_address");

  if (!hlAddress || !isValidEvmAddress(hlAddress)) {
    return NextResponse.json(
      { error: "Invalid or missing hl_address" },
      { status: 400 },
    );
  }

  if (STUB_ENABLED) {
    return NextResponse.json(stubDashboard);
  }

  const validatorUrl = process.env.VALIDATOR_API_URL;
  if (!validatorUrl) {
    return NextResponse.json(
      { error: "Validator API not configured" },
      { status: 500 },
    );
  }

  try {
    const apiKey = process.env.VALIDATOR_API_KEY;

    const [traderRes, limitsRes] = await Promise.all([
      fetch(`${validatorUrl}/hl-traders/${hlAddress}`),
      fetch(`${validatorUrl}/hl-traders/${hlAddress}/limits`),
    ]);

    if (traderRes.status === 404) {
      // Validator doesn't know this address yet — but if it's a paid-up
      // registration in our DB, surface it as a pending state so the
      // dashboard can render a friendly "waiting for first trade" view
      // instead of "Not registered".
      const reg = await findPendingRegistration(hlAddress);
      if (reg) {
        return NextResponse.json(buildPendingTraderPayload(hlAddress, reg), { status: 200 });
      }
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!traderRes.ok) {
      return NextResponse.json(
        { error: `Validator returned ${traderRes.status}` },
        { status: 502 },
      );
    }

    const raw = await traderRes.json();
    const trader = transformTraderResponse(raw);
    const limits = limitsRes.ok ? await limitsRes.json() : null;

    // Fetch statistics + quarterly PnL using synthetic_hotkey from the trader response
    let statistics = null;
    let quarterly_pnl = null;
    if (trader.synthetic_hotkey && apiKey) {
      const authHeaders = { Authorization: `Bearer ${apiKey}` };

      // Quarter start: Jan 1 / Apr 1 / Jul 1 / Oct 1
      const now = new Date();
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const quarterStartMs = new Date(now.getFullYear(), qMonth, 1).getTime();

      const [statsRes, ledgerRes] = await Promise.all([
        fetch(
          `${validatorUrl}/statistics/${trader.synthetic_hotkey}/?checkpoints=false`,
          { headers: authHeaders },
        ).catch(() => null),
        fetch(
          `${validatorUrl}/v2/entity/subaccount/${trader.synthetic_hotkey}?checkpoints_time_ms=${quarterStartMs}`,
          { headers: authHeaders },
        ).catch(() => null),
      ]);

      if (statsRes?.ok) {
        try { statistics = await statsRes.json(); } catch { /* ignore malformed JSON */ }
      }

      if (ledgerRes?.ok) {
        try {
          const ledgerData = await ledgerRes.json();
          const checkpoints = ledgerData?.dashboard?.ledger?.checkpoints || [];
          const realized = checkpoints.reduce((sum, cp) => sum + (cp.r || 0), 0);
          const lastUnrealized = checkpoints.length > 0 ? (checkpoints[checkpoints.length - 1].u || 0) : 0;
          quarterly_pnl = realized + Math.min(0, lastUnrealized);
        } catch { /* ignore malformed JSON */ }
      }
    }

    return NextResponse.json({ ...trader, limits, statistics, quarterly_pnl }, { status: 200 });
  } catch (err) {
    reportCritical(err, { source: "api/dashboard", userId: hlAddress, message: "Could not reach validator" });
    return NextResponse.json(
      { error: "Could not reach validator" },
      { status: 502 },
    );
  }
}
