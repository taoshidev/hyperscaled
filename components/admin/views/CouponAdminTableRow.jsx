"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, PencilSimple } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateCouponNotes } from "@/app/actions/coupons";
import { CouponEditModal } from "@/components/admin/views/CouponEditModal";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex w-full rounded-lg border border-white/[0.08] bg-zinc-950/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 transition-colors focus-visible:outline-none focus-visible:border-teal-400/40 focus-visible:ring-2 focus-visible:ring-teal-400/20 disabled:cursor-not-allowed disabled:opacity-50";

function formatTs(iso) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function emailScopeLabel(emails) {
  if (emails != null && emails.length > 0) return emails.join(", ");
  return "Any email";
}

function tierScopeLabel(ids) {
  if (ids != null && ids.length > 0) return ids.join(", ");
  return "Any tier";
}

function shortenWallet(wallet) {
  if (!wallet) return "—";
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

function CouponRowNotesPanel({
  couponId,
  couponCode,
  notes,
  editing,
  onEditingChange,
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!editing) setDraft(notes ?? "");
  }, [notes, editing]);

  const cancel = () => {
    setDraft(notes ?? "");
    setStatus(null);
    onEditingChange(false);
  };

  const save = () => {
    setStatus(null);
    startTransition(async () => {
      const result = await updateCouponNotes(
        couponId,
        draft.trim() ? draft : null,
      );
      if (!result.success) {
        setStatus({ type: "error", message: result.error });
        return;
      }
      setStatus({ type: "success", message: "Notes saved." });
      onEditingChange(false);
      router.refresh();
    });
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
          Notes
        </span>
        {!editing ? (
          <button
            type="button"
            onClick={() => onEditingChange(true)}
            className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <PencilSimple size={11} weight="bold" aria-hidden />
            {notes?.trim() ? "Edit notes" : "Add notes"}
          </button>
        ) : null}
      </div>
      {editing ? (
        <div className="space-y-2">
          <label htmlFor={`coupon-notes-${couponId}`} className="sr-only">
            Notes for {couponCode}
          </label>
          <textarea
            id={`coupon-notes-${couponId}`}
            rows={3}
            maxLength={500}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={isPending}
            placeholder="Internal description (optional)"
            className={cn(fieldClass, "min-h-[72px] resize-y")}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={save}
              className="inline-flex h-8 items-center rounded-lg border border-teal-400/30 bg-teal-400/15 px-3 text-xs font-medium text-teal-300 transition-colors hover:bg-teal-400/25 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={cancel}
              className="inline-flex h-8 items-center rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 text-xs text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : notes?.trim() ? (
        <p className="whitespace-pre-wrap text-sm text-zinc-200">{notes}</p>
      ) : (
        <p className="text-sm text-zinc-500">No notes yet.</p>
      )}
      {status ? (
        <p
          className={cn(
            "text-xs",
            status.type === "error" ? "text-red-400" : "text-teal-400",
          )}
          role="status"
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}

export function CouponAdminTableRow({ row }) {
  const [open, setOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const isExpired = row.validUntil ? new Date(row.validUntil) < new Date() : false;

  const discountUi =
    row.discountType === "percent"
      ? `${row.discountValue}%`
      : `$${Number(row.discountValue).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  const tierDisp = tierScopeLabel(row.allowedTierIds);
  const emailDisp = emailScopeLabel(row.allowedEmails);
  const redeemedDisplay =
    row.maxUses != null
      ? `${row.redemptionCount}/${row.maxUses}`
      : String(row.redemptionCount);

  const detailId = `coupon-row-${row.id}`;

  const startEditNotes = () => {
    setOpen(true);
    setEditingNotes(true);
  };

  return (
    <>
      <TableRow
        className={cn(
          "border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]",
          isExpired && "opacity-60",
        )}
      >
        <TableCell className="w-10 p-0">
          <button
            type="button"
            className="group inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-white"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((v) => !v)}
          >
            <CaretDown
              size={14}
              weight="bold"
              className={cn(
                "shrink-0 transition-transform duration-200 ease-out",
                "motion-reduce:transition-none",
                open ? "rotate-0" : "-rotate-90",
              )}
              aria-hidden
            />
            <span className="sr-only">
              {open ? "Collapse" : "Expand"} redemption details
            </span>
          </button>
        </TableCell>
        <TableCell className="font-mono text-sm text-white">{row.code}</TableCell>
        <TableCell className="text-sm text-zinc-200">{discountUi}</TableCell>
        <TableCell className="text-xs text-zinc-400">
          {row.useType.replace(/_/g, " ")}
        </TableCell>
        <TableCell
          className="max-w-[200px] truncate font-mono text-xs text-zinc-400"
          title={tierDisp}
        >
          {tierDisp}
        </TableCell>
        <TableCell
          className="max-w-[200px] truncate font-mono text-xs text-zinc-400"
          title={emailDisp}
        >
          {emailDisp}
        </TableCell>
        <TableCell className="text-xs text-zinc-300">{redeemedDisplay}</TableCell>
        <TableCell className="text-xs text-zinc-400">
          {formatTs(row.validUntil)}
        </TableCell>
        <TableCell className="text-xs text-zinc-400">
          {formatTs(row.createdAt)}
        </TableCell>
        <TableCell
          className="max-w-[180px] truncate font-mono text-xs text-zinc-400"
          title={row.createdByWallet ?? undefined}
        >
          {shortenWallet(row.createdByWallet)}
        </TableCell>
        <TableCell>
          {isExpired ? (
            <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-400">
              Expired
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-teal-400/20 bg-teal-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-teal-400">
              Valid
            </span>
          )}
        </TableCell>
        <TableCell className="w-[140px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-teal-400/30 bg-teal-400/15 px-2 py-1 text-[11px] font-medium text-teal-300 transition-colors hover:bg-teal-400/25 hover:text-teal-200"
            >
              <PencilSimple size={11} weight="bold" aria-hidden />
              Edit
            </button>
            <button
              type="button"
              onClick={startEditNotes}
              className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              Notes
            </button>
          </div>
        </TableCell>
      </TableRow>

      <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
        <TableCell colSpan={12} className="bg-[#0a0a0c] p-0">
          <div
            id={detailId}
            role="region"
            aria-label={`Details for coupon ${row.code}`}
            aria-hidden={!open}
            className={cn(
              "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out",
              "motion-reduce:transition-none",
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="px-5 py-4 text-sm">
                <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-zinc-500">
                  <span>id: {row.id}</span>
                  {row.validFrom ? (
                    <span>valid from {formatTs(row.validFrom)}</span>
                  ) : null}
                  {row.batchLabel ? <span>batch: {row.batchLabel}</span> : null}
                </div>
                <CouponRowNotesPanel
                  couponId={row.id}
                  couponCode={row.code}
                  notes={row.notes}
                  editing={editingNotes}
                  onEditingChange={setEditingNotes}
                />
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-teal-400">
                  Users who used this code
                </div>
                {row.redemptions.length === 0 ? (
                  <p className="text-sm text-zinc-500">No redemptions yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
                        <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                          Wallet
                        </TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                          Email
                        </TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                          Redeemed at
                        </TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                          Payment ref
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {row.redemptions.map((r, i) => (
                        <TableRow
                          key={`${r.userId}-${r.redeemedAt}-${i}`}
                          className="border-b border-white/[0.02]"
                        >
                          <TableCell className="font-mono text-xs text-zinc-300">
                            {shortenWallet(r.userWallet)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-zinc-300">
                            {r.userEmail ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-400">
                            {formatTs(r.redeemedAt)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-mono text-xs text-zinc-400">
                            {r.paymentIntentId ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>

      <CouponEditModal open={editOpen} onOpenChange={setEditOpen} coupon={row} />
    </>
  );
}
