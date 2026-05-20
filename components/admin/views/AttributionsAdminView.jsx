import Link from "next/link";
import { DownloadSimple, CaretDown } from "@phosphor-icons/react/dist/ssr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  AdminStickyTableHeader,
  AdminTableEmptyState,
  AdminTablePageRoot,
  AdminTablePaginationBar,
  AdminTableScrollCard,
  adminHeaderRowClass,
  adminTableHeadClass,
} from "@/components/admin/AdminTablePage";
import {
  attributionsExportHref,
  attributionsHref,
} from "@/lib/admin/attributions-command-center-url";
import { cn } from "@/lib/utils";
import { AttributionStatCards } from "@/components/admin/views/AttributionStatCards";

function formatTs(iso) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function fmtUsdc(amount) {
  return `$${Number(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortenWallet(wallet) {
  if (!wallet) return "—";
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

export function AttributionsAdminView({ result, minerSlugs, affiliateSlugs }) {
  const { rows, total, page, pageSize, filters, stats } = result;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goPage = (p) => attributionsHref({ ...filters, page: p });

  return (
    <AdminTablePageRoot>
      <AttributionStatCards stats={stats} />

      <form
        method="GET"
        action="/command-center/attributions"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.06] bg-zinc-900/40 px-4 py-3"
      >
        <Field label="From">
          <input
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
            className={fieldClass}
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            name="to"
            defaultValue={filters.to ?? ""}
            className={fieldClass}
          />
        </Field>
        <Field label="Affiliate">
          <input
            type="text"
            name="affiliate"
            list="aff-slugs"
            defaultValue={filters.affiliate ?? ""}
            placeholder="slug"
            className={cn(fieldClass, "font-mono")}
          />
          <datalist id="aff-slugs">
            {(affiliateSlugs ?? []).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Tenant">
          <input
            type="text"
            name="tenant"
            list="miner-slugs"
            defaultValue={filters.tenant ?? ""}
            placeholder="miner slug"
            className={cn(fieldClass, "font-mono")}
          />
          <datalist id="miner-slugs">
            {(minerSlugs ?? []).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Promo code">
          <input
            type="text"
            name="promo"
            defaultValue={filters.promo ?? ""}
            placeholder="CODE"
            className={cn(fieldClass, "font-mono uppercase")}
          />
        </Field>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg border border-teal-400/30 bg-teal-400/15 px-3.5 py-2 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-400/25 hover:text-teal-200"
          >
            Apply
          </button>
          <Link
            href="/command-center/attributions"
            className="text-xs text-zinc-500 transition-colors hover:text-teal-400"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/40">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-white">
              Conversion ledger
            </h2>
            <span className="text-xs text-zinc-500">({total})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={attributionsExportHref(filters, "csv")}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <DownloadSimple size={14} weight="bold" />
              Export CSV
              <CaretDown size={11} weight="bold" />
            </a>
            <a
              href={attributionsExportHref(filters, "json")}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <DownloadSimple size={14} weight="bold" />
              Export JSON
            </a>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AdminTableScrollCard className="min-h-[240px] flex-1 rounded-none border-0 bg-transparent">
            {rows.length === 0 ? (
              <AdminTableEmptyState>
                No conversions match these filters yet. Adjust the date range
                or filters above.
              </AdminTableEmptyState>
            ) : (
              <Table containerClassName="overflow-visible">
                <AdminStickyTableHeader>
                  <TableRow className={adminHeaderRowClass}>
                    <TableHead className={adminTableHeadClass}>
                      Registered at
                    </TableHead>
                    <TableHead className={adminTableHeadClass}>
                      Affiliate
                    </TableHead>
                    <TableHead className={adminTableHeadClass}>
                      Tenant
                    </TableHead>
                    <TableHead className={adminTableHeadClass}>Promo</TableHead>
                    <TableHead className={adminTableHeadClass}>User</TableHead>
                    <TableHead className={adminTableHeadClass}>
                      Account
                    </TableHead>
                    <TableHead className={cn(adminTableHeadClass, "text-right")}>
                      Amount
                    </TableHead>
                  </TableRow>
                </AdminStickyTableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.id}
                      className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                    >
                      <TableCell className="text-xs text-zinc-300">
                        {formatTs(r.registeredAt)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {r.affiliateSlug ? (
                          r.affiliateSlug
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {r.entityMinerSlug ? (
                          <span className="inline-flex items-center rounded-md border border-teal-400/20 bg-teal-400/10 px-1.5 py-0.5 text-[10px] text-teal-300">
                            {r.entityMinerSlug}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {r.promoCode ? (
                          r.promoCode
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </TableCell>
                      <TableCell
                        className="max-w-[220px] truncate text-xs text-zinc-300"
                        title={r.userEmail ?? r.userWallet ?? ""}
                      >
                        {r.userEmail ?? (
                          <span className="font-mono">{shortenWallet(r.userWallet)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300">
                        {r.accountSize ? `$${(r.accountSize / 1000).toLocaleString()}K` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-white tabular-nums">
                        {fmtUsdc(r.amountUsdc)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AdminTableScrollCard>
        </div>
      </div>

      {total > 0 ? (
        <AdminTablePaginationBar className="shrink-0 py-2">
          <span className="text-xs text-zinc-500">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Link
              href={goPage(Math.max(1, page - 1))}
              prefetch={false}
              aria-disabled={page <= 1}
              className={cn(
                "rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 py-1.5 transition-colors hover:bg-white/[0.04] hover:text-white",
                page <= 1 && "pointer-events-none opacity-40",
              )}
            >
              Previous
            </Link>
            <span>
              Page {page} / {totalPages}
            </span>
            <Link
              href={goPage(page + 1)}
              prefetch={false}
              aria-disabled={page >= totalPages}
              className={cn(
                "rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 py-1.5 transition-colors hover:bg-white/[0.04] hover:text-white",
                page >= totalPages && "pointer-events-none opacity-40",
              )}
            >
              Next
            </Link>
          </div>
        </AdminTablePaginationBar>
      ) : null}
    </AdminTablePageRoot>
  );
}

const fieldClass =
  "h-9 w-40 rounded-lg border border-white/[0.08] bg-zinc-950/60 px-3 text-sm text-white placeholder:text-zinc-600 transition-colors [color-scheme:dark] focus-visible:border-teal-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/20";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}
