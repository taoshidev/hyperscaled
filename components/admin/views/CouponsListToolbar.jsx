"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, DownloadSimple, Trash, Prohibit } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  invalidateAllCoupons,
  deleteUnredeemedCoupons,
} from "@/app/actions/coupons";
import { cn } from "@/lib/utils";

function couponsExportPath(tab, format) {
  const p = new URLSearchParams();
  if (tab !== "all") p.set("tab", tab);
  if (format === "json") p.set("format", "json");
  const s = p.toString();
  return `/api/command-center/export/coupons${s ? `?${s}` : ""}`;
}

const baseBtn =
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const ghostBtn = cn(
  baseBtn,
  "border-white/[0.08] bg-zinc-900/70 text-zinc-300 hover:bg-white/[0.04] hover:text-white",
);

const dangerBtn = cn(
  baseBtn,
  "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200",
);

export function CouponsListToolbar({ tab }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const csvHref = couponsExportPath(tab, "csv");
  const jsonHref = couponsExportPath(tab, "json");

  const handleInvalidateAll = async () => {
    if (!confirm("Invalidate all coupons? They will stop working immediately.")) return;
    setBusy(true);
    try {
      const result = await invalidateAllCoupons();
      if (result.success) {
        alert(`Invalidated ${result.count ?? 0} coupon(s).`);
        router.refresh();
      } else {
        alert(result.error ?? "Failed to invalidate.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteUnredeemed = async () => {
    if (!confirm("Delete all coupons that have never been used?")) return;
    setBusy(true);
    try {
      const result = await deleteUnredeemedCoupons();
      if (result.success) {
        alert(`Deleted ${result.deletedCount ?? 0} unredeemed coupon(s).`);
        router.refresh();
      } else {
        alert(result.error ?? "Failed to delete.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={ghostBtn} disabled={busy}>
            <DownloadSimple size={14} weight="bold" />
            Export
            <CaretDown size={11} weight="bold" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-32 rounded-lg border border-white/[0.08] bg-[#0c0c0e]/95 p-1 backdrop-blur-xl"
        >
          <DropdownMenuItem asChild>
            <a
              href={csvHref}
              download
              className="rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white"
            >
              CSV
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={jsonHref}
              download
              className="rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.04] hover:text-white focus:bg-white/[0.04] focus:text-white"
            >
              JSON
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        className={ghostBtn}
        disabled={busy}
        onClick={handleDeleteUnredeemed}
      >
        <Trash size={14} weight="bold" />
        Delete unredeemed
      </button>

      <button
        type="button"
        className={dangerBtn}
        disabled={busy}
        onClick={handleInvalidateAll}
      >
        <Prohibit size={14} weight="bold" />
        Invalidate all
      </button>
    </div>
  );
}
