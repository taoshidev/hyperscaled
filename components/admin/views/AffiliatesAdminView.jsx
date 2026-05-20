"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MagnifyingGlass } from "@phosphor-icons/react";
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
  affiliatesPageHref,
  affiliatesSortToggleHref,
  affiliatesTabHref,
  affiliatesCommandCenterHref,
} from "@/lib/admin/affiliates-command-center-url";
import { cn } from "@/lib/utils";
import { AffiliateAdminTableRow } from "@/components/admin/views/AffiliateAdminTableRow";
import { AffiliateEditModal } from "@/components/admin/views/AffiliateEditModal";

const TAB_DEFS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "tenant", label: "Tenants" },
];

export function AffiliatesAdminView({
  result,
  parentChoices,
  minerChoices,
  promoCodes,
}) {
  const { rows, total, page, pageSize, tab, q, sort } = result;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const { activeSort, activeDir } = sort;

  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const sortHref = (column) =>
    affiliatesSortToggleHref(tab, q, page, activeSort, activeDir, column);
  const pageHref = (p) => affiliatesPageHref(tab, q, p, activeSort, activeDir);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
  };

  return (
    <AdminTablePageRoot>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
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
                href={affiliatesTabHref(t.id, q, activeSort, activeDir)}
                prefetch={false}
                className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <form
          method="GET"
          action="/command-center/affiliates"
          className="ml-auto flex items-center gap-2"
        >
          {tab !== "all" ? <input type="hidden" name="tab" value={tab} /> : null}
          {activeSort ? (
            <>
              <input type="hidden" name="sort" value={activeSort} />
              <input type="hidden" name="dir" value={activeDir ?? "asc"} />
            </>
          ) : null}
          <div className="relative">
            <MagnifyingGlass
              size={14}
              weight="bold"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search slug or name"
              className="h-9 w-56 rounded-lg border border-white/[0.08] bg-zinc-950/60 pl-8 pr-3 text-sm text-white placeholder:text-zinc-600 transition-colors focus-visible:border-teal-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/20"
            />
          </div>
        </form>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-400/30 bg-teal-400/15 px-3.5 py-2 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-400/25 hover:text-teal-200"
        >
          <Plus size={14} weight="bold" />
          Add affiliate
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/40">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-white">Affiliates</h2>
            <span className="text-xs text-zinc-500">({total})</span>
          </div>
          {q ? (
            <Link
              href={affiliatesCommandCenterHref({ tab, sort: activeSort, dir: activeDir })}
              prefetch={false}
              className="text-xs text-zinc-500 transition-colors hover:text-teal-400"
            >
              Clear search
            </Link>
          ) : null}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AdminTableScrollCard className="min-h-[240px] flex-1 rounded-none border-0 bg-transparent">
            {rows.length === 0 ? (
              <AdminTableEmptyState>
                No affiliates match these filters. Adjust the tabs / search above
                or add a new affiliate.
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
                      label="Slug"
                      sortKey="slug"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("slug")}
                    />
                    <AdminSortableTh
                      className={adminTableHeadClass}
                      label="Name"
                      sortKey="name"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("name")}
                    />
                    <TableHead className={adminTableHeadClass}>Parent</TableHead>
                    <TableHead className={adminTableHeadClass}>Tenant</TableHead>
                    <AdminSortableTh
                      className={adminTableHeadClass}
                      label="Clicks"
                      sortKey="useCount"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("useCount")}
                    />
                    <AdminSortableTh
                      className={adminTableHeadClass}
                      label="Created"
                      sortKey="createdAt"
                      activeSort={activeSort}
                      activeDir={activeDir}
                      href={sortHref("createdAt")}
                    />
                    <TableHead className={adminTableHeadClass}>Status</TableHead>
                    <TableHead className={cn(adminTableHeadClass, "text-right")}>
                      Actions
                    </TableHead>
                  </TableRow>
                </AdminStickyTableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <AffiliateAdminTableRow
                      key={r.id}
                      row={r}
                      onEdit={openEdit}
                      promoCodes={promoCodes}
                    />
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

      <AffiliateEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        affiliate={editing}
        parentChoices={parentChoices}
        minerChoices={minerChoices}
      />
    </AdminTablePageRoot>
  );
}
