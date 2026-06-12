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
import { updateCoupon } from "@/app/actions/coupons";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex h-9 w-full rounded-lg border border-white/[0.08] bg-zinc-950/60 px-3 py-1 text-sm text-white placeholder:text-zinc-600 transition-colors focus-visible:outline-none focus-visible:border-teal-400/40 focus-visible:ring-2 focus-visible:ring-teal-400/20 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:invert hover:[&::-webkit-calendar-picker-indicator]:opacity-100";

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

/** ISO string -> value for a <input type="datetime-local"> (local time). */
function isoToLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function CouponEditModal({ open, onOpenChange, coupon }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [useType, setUseType] = useState("one_time");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [batchLabel, setBatchLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !coupon) return;
    setCode(coupon.code ?? "");
    setDiscountType(coupon.discountType ?? "percent");
    setDiscountValue(String(coupon.discountValue ?? ""));
    setUseType(coupon.useType ?? "one_time");
    setMaxUses(coupon.maxUses != null ? String(coupon.maxUses) : "");
    setValidFrom(isoToLocalInput(coupon.validFrom));
    setValidUntil(isoToLocalInput(coupon.validUntil));
    setNotes(coupon.notes ?? "");
    setBatchLabel(coupon.batchLabel ?? "");
    setError(null);
  }, [open, coupon]);

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await updateCoupon({
        id: coupon.id,
        code: code.trim(),
        discountType,
        discountValue: Number(discountValue),
        useType,
        maxUses: useType === "multi_use" ? Number(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom).toISOString() : null,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        notes: notes.trim() || null,
        batchLabel: batchLabel.trim() || null,
      });
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to save.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  const redemptionCount = coupon?.redemptionCount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(720px,92dvh)] flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#0c0c0e] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-2 border-b border-white/[0.06] px-6 pb-4 pt-6 pr-12 text-left">
          <div className="flex items-center gap-1.5">
            <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
              Edit code
            </span>
          </div>
          <DialogTitle className="font-mono text-white">
            {coupon?.code ?? "Coupon"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Changes apply immediately at checkout. This code already has{" "}
            {redemptionCount} redemption{redemptionCount === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label className="text-zinc-300">Code</Label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
              className={cn(fieldClass, "font-mono")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">Discount type</Label>
              <NativeSelect value={discountType} onChange={setDiscountType} disabled={busy}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (USDC)</option>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Value {discountType === "percent" ? "(%)" : "(USDC)"}
              </Label>
              <input
                type="number"
                min={0}
                step={discountType === "percent" ? 1 : 0.01}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                disabled={busy}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Use type</Label>
              <NativeSelect
                value={useType}
                onChange={(v) => {
                  setUseType(v);
                  if (v !== "multi_use") setMaxUses("");
                }}
                disabled={busy}
              >
                <option value="one_time">One time</option>
                <option value="multi_use">Multi use</option>
                <option value="unlimited">Unlimited</option>
              </NativeSelect>
            </div>
          </div>

          {useType === "multi_use" ? (
            <div className="space-y-2">
              <Label className="text-zinc-300">Max redemptions</Label>
              <input
                type="number"
                min={1}
                step={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                disabled={busy}
                className={fieldClass}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">Valid from</Label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                disabled={busy}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Valid until</Label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={busy}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Batch label</Label>
            <input
              type="text"
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              placeholder="e.g. beanstock-2026-07"
              disabled={busy}
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Notes</Label>
            <textarea
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={busy}
              placeholder="Internal description (optional)"
              className={cn(fieldClass, "min-h-[72px] resize-y py-2")}
            />
          </div>

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
            onClick={handleSave}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
