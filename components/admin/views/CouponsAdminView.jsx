import Link from "next/link";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
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
  couponsPageHref,
  couponsSortToggleHref,
  couponsTabHref,
} from "@/lib/admin/coupons-command-center-url";
import { cn } from "@/lib/utils";
import { CouponsListToolbar } from "@/components/admin/views/CouponsListToolbar";
import { CouponAdminTableRow } from "@/components/admin/views/CouponAdminTableRow";

const TAB_DEFS = [
  { id: "all", label: "All discounts" },
  { id: "percent", label: "Percent off" },
  { id: "fixed", label: "Fixed ($) off" },
  { id: "tier_restricted", label: "Tier-restricted" },
];

export function CouponsAdminView({ result }) {
  const { rows, total, page, pageSize, tab, sort } = result;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const { activeSort, activeDir } = sort;

  const sortHref = (column) =>
    couponsSortToggleHref(tab, page, activeSort, activeDir, column);
  const pageHref = (p) => couponsPageHref(tab, p, activeSort, activeDir);

  return (
    <AdminTablePageRoot>
      <div className="flex shrink-0 flex-wrap gap-1">
        {TAB_DEFS.map((t) => {
          const active = tab === t.id;
          if (active) {
            return (
              <span
                key={t.id}
                className="rounded-lg border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-sm font-medium text-teal-400"
              >
                {t.label}
              </span>
            );
          }
          return (
            <Link
              key={t.id}
              href={couponsTabHref(t.id, activeSort, activeDir)}
              prefetch={false}
              className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/40">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-white">Promotional codes</h2>
            <span className="text-xs text-zinc-500">({total})</span>
          </div>
          <CouponsListToolbar tab={tab} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AdminTableScrollCard className="min-h-[240px] flex-1 rounded-none border-0 bg-transparent">
            {rows.length === 0 ? (
              <AdminTableEmptyState>
                No coupons in this category. Adjust the tabs above or create a new code.
              </AdminTableEmptyState>
            ) : (
              <Table containerClassName="overflow-visible">
                <AdminStickyTableHeader>
                  <TableRow className={adminHeaderRowClass}>
                    <TableHead className={cn(adminTableHeadClass, "w-10")}>
                      <span className="sr-only">Expand</span>
                    </TableHead>
                    <AdminSortableTh
                      className={adminTableHeadClass}
                      label="Code"
                      sortKey="code"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("code")}
                    />
                    <AdminSortableTh
                      className={adminTableHeadClass}
                      label="Discount"
                      sortKey="discountValue"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("discountValue")}
                    />
                    <AdminSortableTh
                      className={adminTableHeadClass}
                      label="Use type"
                      sortKey="useType"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("useType")}
                    />
                    <TableHead className={cn(adminTableHeadClass, "max-w-[200px]")}>
                      Tier scope
                    </TableHead>
                    <TableHead className={cn(adminTableHeadClass, "max-w-[200px]")}>
                      Email scope
                    </TableHead>
                    <AdminSortableTh
                      className={adminTableHeadClass}
                      label="Redeemed"
                      sortKey="redemptionCount"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("redemptionCount")}
                    />
                    <AdminSortableTh
                      className={adminTableHeadClass}
                      label="Valid until"
                      sortKey="validUntil"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("validUntil")}
                    />
                    <AdminSortableTh
                      className={adminTableHeadClass}
                      label="Created"
                      sortKey="createdAt"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("createdAt")}
                    />
                    <TableHead className={cn(adminTableHeadClass, "max-w-[180px]")}>
                      Created by
                    </TableHead>
                    <TableHead className={adminTableHeadClass}>Status</TableHead>
                    <TableHead className={cn(adminTableHeadClass, "w-[100px]")}>
                      Actions
                    </TableHead>
                  </TableRow>
                </AdminStickyTableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <CouponAdminTableRow key={r.id} row={r} />
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
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Link
              href={pageHref(Math.max(1, page - 1))}
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
              href={pageHref(page + 1)}
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
