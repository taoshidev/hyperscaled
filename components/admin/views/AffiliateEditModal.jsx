"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { upsertAffiliate } from "@/app/actions/affiliates";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex h-9 w-full rounded-lg border border-white/[0.08] bg-zinc-950/60 px-3 py-1 text-sm text-white placeholder:text-zinc-600 transition-colors [color-scheme:dark] focus-visible:outline-none focus-visible:border-teal-400/40 focus-visible:ring-2 focus-visible:ring-teal-400/20 disabled:cursor-not-allowed disabled:opacity-50";

function NativeSelect({ value, onChange, children, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(fieldClass, "appearance-none pr-9")}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='%2371717a'><path d='M3 4.5l3 3 3-3' stroke='%2371717a' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.65rem center",
        backgroundSize: "12px 12px",
      }}
    >
      {children}
    </select>
  );
}

export function AffiliateEditModal({
  open,
  onOpenChange,
  affiliate,
  parentChoices,
  minerChoices,
}) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [minerHotkey, setMinerHotkey] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSlug(affiliate?.slug ?? "");
    setName(affiliate?.name ?? "");
    setParentId(
      affiliate?.parentAffiliateId == null
        ? ""
        : String(affiliate.parentAffiliateId),
    );
    setMinerHotkey(affiliate?.entityMinerHotkey ?? "");
    setIsActive(affiliate?.isActive ?? true);
    setError(null);
  }, [affiliate, open]);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await upsertAffiliate({
        id: affiliate?.id,
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        parentAffiliateId: parentId || null,
        entityMinerHotkey: minerHotkey || null,
        isActive,
      });
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to save");
      }
    } finally {
      setBusy(false);
    }
  };

  const isNew = !affiliate?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#0c0c0e] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-2 border-b border-white/[0.06] px-6 pb-4 pt-6 pr-12 text-left">
          <div className="flex items-center gap-1.5">
            <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
              {isNew ? "New affiliate" : "Edit affiliate"}
            </span>
          </div>
          <DialogTitle className="text-white">
            {isNew ? "Add affiliate" : `Edit ${affiliate.slug}`}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Slugs go directly into <span className="font-mono">?affiliate=</span>{" "}
            URLs. Set a tenant when this affiliate represents one of the
            partner companies (entity miners).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Slug</Label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="jdoe"
                className={cn(fieldClass, "font-mono")}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Display name</Label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className={fieldClass}
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Parent affiliate</Label>
            <NativeSelect value={parentId} onChange={setParentId} disabled={busy}>
              <option value="">— None (top level) —</option>
              {parentChoices.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
            <p className="text-[11px] text-zinc-500">
              Sub-affiliates that operate under another affiliate&apos;s account.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Tenant (entity miner)</Label>
            <NativeSelect
              value={minerHotkey}
              onChange={setMinerHotkey}
              disabled={busy}
            >
              <option value="">— None —</option>
              {minerChoices.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                  {m.slug ? `  (?tenant=${m.slug})` : ""}
                </option>
              ))}
            </NativeSelect>
            <p className="text-[11px] text-zinc-500">
              Set when this affiliate row IS one of the partner companies. The
              miner&apos;s slug becomes the value used in{" "}
              <span className="font-mono">?tenant=</span>.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={busy}
              className="h-4 w-4 cursor-pointer rounded border-white/20 bg-zinc-950 text-teal-400 focus:ring-1 focus:ring-teal-400/40"
              style={{ accentColor: "#00C6A7" }}
            />
            Active (clicks resolve to this slug; signups can still attribute)
          </label>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 gap-3 border-t border-white/[0.06] bg-[#0c0c0e] px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : isNew ? "Create affiliate" : "Save changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
