import { CursorClick, UserCirclePlus, ShoppingCart, CurrencyDollar } from "@phosphor-icons/react/dist/ssr";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2 text-zinc-400">
        <Icon size={14} weight="bold" className="text-teal-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  );
}

function fmtNumber(n) {
  return Number(n ?? 0).toLocaleString();
}

function fmtUsdc(n) {
  return `$${Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function AttributionStatCards({ stats }) {
  const conversionRate =
    stats.signups > 0
      ? `${((stats.conversions / stats.signups) * 100).toFixed(1)}% of signups`
      : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={CursorClick}
        label="Clicks"
        value={fmtNumber(stats.clicks)}
      />
      <StatCard
        icon={UserCirclePlus}
        label="Signups"
        value={fmtNumber(stats.signups)}
        sub={
          stats.clicks > 0
            ? `${((stats.signups / stats.clicks) * 100).toFixed(1)}% of clicks`
            : null
        }
      />
      <StatCard
        icon={ShoppingCart}
        label="Conversions"
        value={fmtNumber(stats.conversions)}
        sub={conversionRate}
      />
      <StatCard
        icon={CurrencyDollar}
        label="Revenue"
        value={fmtUsdc(stats.revenueUsdc)}
        sub={
          stats.conversions > 0
            ? `${fmtUsdc(stats.revenueUsdc / stats.conversions)} avg`
            : null
        }
      />
    </div>
  );
}
