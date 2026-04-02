import { NextResponse } from "next/server";
import { STUB_ENABLED, stubDashboard } from "@/lib/gateway-stubs";
import { isValidEvmAddress } from "@/lib/validation";
import { reportCritical } from "@/lib/errors";
import { transformTraderResponse } from "@/lib/transform-trader";

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
