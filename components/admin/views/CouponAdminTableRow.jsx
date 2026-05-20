"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

export function CouponAdminTableRow({ row }) {
  const [open, setOpen] = useState(false);
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
      </TableRow>

      <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
        <TableCell colSpan={11} className="bg-[#0a0a0c] p-0">
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
                  {row.validFrom ? <span>valid from {formatTs(row.validFrom)}</span> : null}
                </div>
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
    </>
  );
}
