"use client";

import { useState } from "react";
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
import { setAffiliateActive } from "@/app/actions/affiliates";
import { cn } from "@/lib/utils";
import { AffiliateShareLinkGenerator } from "@/components/admin/views/AffiliateShareLinkGenerator";

function formatTs(iso) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

export function AffiliateAdminTableRow({ row, onEdit, promoCodes }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const detailId = `affiliate-row-${row.id}`;

  const toggleActive = async () => {
    setBusy(true);
    try {
      await setAffiliateActive(row.id, !row.isActive);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TableRow
        className={cn(
          "border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]",
          !row.isActive && "opacity-60",
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
              {open ? "Collapse" : "Expand"} share-link generator
            </span>
          </button>
        </TableCell>
        <TableCell className="font-mono text-sm text-white">{row.slug}</TableCell>
        <TableCell className="text-sm text-zinc-200">{row.name}</TableCell>
        <TableCell className="text-xs text-zinc-400">
          {row.parent ? (
            <span className="font-mono">{row.parent.slug}</span>
          ) : (
            <span className="text-zinc-600">—</span>
          )}
        </TableCell>
        <TableCell className="text-xs text-zinc-400">
          {row.entityMinerSlug ? (
            <span className="inline-flex items-center rounded-md border border-teal-400/20 bg-teal-400/10 px-1.5 py-0.5 font-mono text-[10px] text-teal-300">
              {row.entityMinerSlug}
            </span>
          ) : (
            <span className="text-zinc-600">—</span>
          )}
        </TableCell>
        <TableCell className="text-xs text-zinc-300">{row.useCount}</TableCell>
        <TableCell className="text-xs text-zinc-400">
          {formatTs(row.createdAt)}
        </TableCell>
        <TableCell>
          {row.isActive ? (
            <span className="inline-flex items-center rounded-full border border-teal-400/20 bg-teal-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-teal-400">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-zinc-500/20 bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Inactive
            </span>
          )}
        </TableCell>
        <TableCell className="w-32">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(row)}
              className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <PencilSimple size={11} weight="bold" />
              Edit
            </button>
            <button
              type="button"
              onClick={toggleActive}
              disabled={busy}
              className="rounded-md border border-white/[0.08] bg-zinc-900/70 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
            >
              {row.isActive ? "Disable" : "Enable"}
            </button>
          </div>
        </TableCell>
      </TableRow>

      <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
        <TableCell colSpan={9} className="bg-[#0a0a0c] p-0">
          <div
            id={detailId}
            role="region"
            aria-label={`Share-link generator for ${row.slug}`}
            aria-hidden={!open}
            className={cn(
              "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out",
              "motion-reduce:transition-none",
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="px-5 py-4">
                <AffiliateShareLinkGenerator
                  affiliateSlug={row.slug}
                  defaultTenantSlug={row.entityMinerSlug ?? null}
                  defaultPromoCode={row.promoCode ?? null}
                  promoCodes={promoCodes}
                />
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}
