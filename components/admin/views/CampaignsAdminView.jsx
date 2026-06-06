"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Plus,
  PencilSimpleLine,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Trash,
} from "@phosphor-icons/react";
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
  AdminTableScrollCard,
  adminHeaderRowClass,
  adminTableHeadClass,
} from "@/components/admin/AdminTablePage";
import {
  activateCampaign,
  deleteCampaign,
  pauseCampaign,
  resumeCampaign,
} from "@/app/actions/admin/campaigns";
import { CampaignFormModal } from "@/components/admin/views/CampaignFormModal";
import { CampaignEndDialog } from "@/components/admin/views/CampaignEndDialog";
import { useRouter } from "next/navigation";

const STATUS_LABEL = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  paused: "Paused",
  ended: "Ended",
};

const STATUS_PILL = {
  active:
    "bg-teal-400/10 text-teal-400 border border-teal-400/20",
  scheduled:
    "bg-amber-400/10 text-amber-300 border border-amber-400/20",
  paused:
    "bg-amber-400/10 text-amber-300 border border-amber-400/20",
  draft: "bg-white/[0.04] text-zinc-400 border border-white/[0.08]",
  ended: "bg-white/[0.02] text-zinc-500 border border-white/[0.06]",
};

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function discountLabel(row) {
  if (row.couponDiscountValue == null) return "—";
  const v = Number(row.couponDiscountValue);
  if (!Number.isFinite(v)) return row.couponDiscountValue;
  return row.couponDiscountType === "percent" ? `${v}%` : `$${v}`;
}

export function CampaignsAdminView({ campaigns, couponChoices, tierChoices, tenantChoices }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ending, setEnding] = useState(null);
  const [pending, startTransition] = useTransition();

  const sortedRows = useMemo(() => {
    const order = { active: 0, paused: 1, scheduled: 2, draft: 3, ended: 4 };
    return [...campaigns].sort((a, b) => {
      const oa = order[a.status] ?? 4;
      const ob = order[b.status] ?? 4;
      if (oa !== ob) return oa - ob;
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });
  }, [campaigns]);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const onActivate = async (id) => {
    const res = await activateCampaign(id);
    if (!res.success) {
      window.alert(res.error ?? "Failed to activate campaign.");
      return;
    }
    refresh();
  };

  const onPause = async (id) => {
    const res = await pauseCampaign(id);
    if (!res.success) {
      window.alert(res.error ?? "Failed to pause campaign.");
      return;
    }
    refresh();
  };

  const onResume = async (id) => {
    const res = await resumeCampaign(id);
    if (!res.success) {
      window.alert(res.error ?? "Failed to resume campaign.");
      return;
    }
    refresh();
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this campaign? This cannot be undone.")) return;
    const res = await deleteCampaign(id);
    if (!res.success) {
      window.alert(res.error ?? "Failed to delete campaign.");
      return;
    }
    refresh();
  };

  return (
    <AdminTablePageRoot>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-sm font-medium text-teal-400 transition-colors hover:bg-teal-400/20"
        >
          <Plus size={14} weight="bold" />
          New campaign
        </button>
      </div>
      <AdminTableScrollCard>
        {sortedRows.length === 0 ? (
          <AdminTableEmptyState>
            No campaigns yet — create one to drive site-wide promo banners and
            auto-applied checkout discounts.
          </AdminTableEmptyState>
        ) : (
          <Table>
            <AdminStickyTableHeader>
              <TableRow className={adminHeaderRowClass}>
                <TableHead className={adminTableHeadClass}>Name</TableHead>
                <TableHead className={adminTableHeadClass}>Status</TableHead>
                <TableHead className={adminTableHeadClass}>Coupon</TableHead>
                <TableHead className={adminTableHeadClass}>Discount</TableHead>
                <TableHead className={adminTableHeadClass}>Tenant</TableHead>
                <TableHead className={adminTableHeadClass}>Window</TableHead>
                <TableHead className={adminTableHeadClass}>Banner</TableHead>
                <TableHead className={adminTableHeadClass}>Redemptions</TableHead>
                <TableHead className={adminTableHeadClass + " text-right"}>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </AdminStickyTableHeader>
            <TableBody>
              {sortedRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <TableCell className="align-top">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{row.name}</span>
                      <span className="text-xs text-zinc-500">{row.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
                        (STATUS_PILL[row.status] ?? STATUS_PILL.draft)
                      }
                    >
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </TableCell>
                  <TableCell className="align-top font-mono text-xs text-zinc-300">
                    {row.couponCode ?? "—"}
                  </TableCell>
                  <TableCell className="align-top text-sm text-zinc-200">
                    {discountLabel(row)}
                  </TableCell>
                  <TableCell className="align-top text-sm text-zinc-300">
                    {Array.isArray(row.minerNames) && row.minerNames.length > 0 ? (
                      <span title={row.minerNames.join(", ")}>
                        {row.minerNames.join(", ")}
                      </span>
                    ) : (
                      <span className="text-zinc-500">All brands</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs text-zinc-400">
                    <div>{fmtDate(row.startsAt)}</div>
                    <div className="text-zinc-600">→ {fmtDate(row.endsAt)}</div>
                  </TableCell>
                  <TableCell className="align-top text-xs text-zinc-400">
                    {row.bannerEnabled ? (
                      <span className="text-teal-400">On</span>
                    ) : (
                      <span className="text-zinc-500">Off</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-sm text-zinc-300 tabular-nums">
                    {row.redemptionCount ?? 0}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(row);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/[0.06]"
                      >
                        <PencilSimpleLine size={12} />
                        Edit
                      </button>
                      {row.status === "draft" || row.status === "scheduled" ? (
                        <button
                          type="button"
                          onClick={() => onActivate(row.id)}
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-md border border-teal-400/20 bg-teal-400/10 px-2 py-1 text-xs text-teal-400 transition-colors hover:bg-teal-400/20"
                        >
                          <PlayCircle size={12} />
                          Activate
                        </button>
                      ) : null}
                      {row.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => onPause(row.id)}
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs text-amber-300 transition-colors hover:bg-amber-400/20"
                        >
                          <PauseCircle size={12} />
                          Pause
                        </button>
                      ) : null}
                      {row.status === "paused" ? (
                        <button
                          type="button"
                          onClick={() => onResume(row.id)}
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-md border border-teal-400/20 bg-teal-400/10 px-2 py-1 text-xs text-teal-400 transition-colors hover:bg-teal-400/20"
                        >
                          <PlayCircle size={12} />
                          Resume
                        </button>
                      ) : null}
                      {row.status === "active" || row.status === "paused" ? (
                        <button
                          type="button"
                          onClick={() => setEnding(row)}
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs text-amber-300 transition-colors hover:bg-amber-400/20"
                        >
                          <StopCircle size={12} />
                          End
                        </button>
                      ) : null}
                      {row.status === "draft" ||
                      row.status === "scheduled" ||
                      row.status === "ended" ? (
                        <button
                          type="button"
                          onClick={() => onDelete(row.id)}
                          disabled={pending}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-400/20 bg-rose-400/5 px-2 py-1 text-xs text-rose-300 transition-colors hover:bg-rose-400/10 disabled:opacity-50"
                        >
                          <Trash size={12} />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AdminTableScrollCard>
      <CampaignFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        couponChoices={couponChoices}
        tierChoices={tierChoices}
        tenantChoices={tenantChoices}
        onSaved={() => {
          setModalOpen(false);
          refresh();
        }}
      />
      <CampaignEndDialog
        campaign={ending}
        open={ending != null}
        onClose={() => setEnding(null)}
        onEnded={() => {
          setEnding(null);
          refresh();
        }}
      />
    </AdminTablePageRoot>
  );
}
