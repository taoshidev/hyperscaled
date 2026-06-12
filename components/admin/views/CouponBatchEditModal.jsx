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
import {
  listCouponBatches,
  bulkUpdateCouponsByBatch,
} from "@/app/actions/coupons";
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

function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export function CouponBatchEditModal({ open, onOpenChange }) {
  const router = useRouter();
  const [batches, setBatches] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState("");

  const [setUntil, setSetUntil] = useState(true);
  const [validUntil, setValidUntil] = useState("");
  const [setFrom, setSetFrom] = useState(false);
  const [validFrom, setValidFrom] = useState("");
  const [setDiscount, setSetDiscount] = useState(false);
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!open) {
      setBatches(null);
      setSelected("");
      setSetUntil(true);
      setValidUntil("");
      setSetFrom(false);
      setValidFrom("");
      setSetDiscount(false);
      setDiscountType("percent");
      setDiscountValue("");
      setError(null);
      setDone(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await listCouponBatches();
        if (cancelled) return;
        setBatches(list);
        if (list.length > 0) setSelected(list[0].batchLabel);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load batches.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const current = batches?.find((b) => b.batchLabel === selected) ?? null;
  const nothingChecked = !setUntil && !setFrom && !setDiscount;

  const handleApply = async () => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const payload = { batchLabel: selected };
      if (setUntil) {
        payload.validUntil = validUntil ? new Date(validUntil).toISOString() : null;
      }
      if (setFrom) {
        payload.validFrom = validFrom ? new Date(validFrom).toISOString() : null;
      }
      if (setDiscount) {
        payload.discountType = discountType;
        payload.discountValue = Number(discountValue);
      }
      const result = await bulkUpdateCouponsByBatch(payload);
      if (result.success) {
        setDone(`Updated ${result.count} code${result.count === 1 ? "" : "s"}.`);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(720px,92dvh)] flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#0c0c0e] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-2 border-b border-white/[0.06] px-6 pb-4 pt-6 pr-12 text-left">
          <div className="flex items-center gap-1.5">
            <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
              Bulk edit
            </span>
          </div>
          <DialogTitle className="text-white">Edit a batch of codes</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Re-date or re-price every code created together in one import (for
            example, shift the end date for an entire partner cohort).
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {loadError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {loadError}
            </div>
          ) : batches == null ? (
            <p className="text-sm text-zinc-400">Loading batches…</p>
          ) : batches.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No batches yet. Codes get a batch label when created via the bulk
              affiliate import (or set one on an individual code).
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-300">Batch</Label>
                <NativeSelect value={selected} onChange={setSelected} disabled={busy}>
                  {batches.map((b) => (
                    <option key={b.batchLabel} value={b.batchLabel}>
                      {b.batchLabel} ({b.count})
                    </option>
                  ))}
                </NativeSelect>
                {current ? (
                  <p className="text-[11px] text-zinc-500">
                    {current.count} code{current.count === 1 ? "" : "s"} · current
                    end dates {fmtDate(current.minValidUntil)} →{" "}
                    {fmtDate(current.maxValidUntil)}
                  </p>
                ) : null}
              </div>

              <fieldset className="space-y-3 rounded-lg border border-white/[0.06] bg-zinc-900/40 p-3">
                <label className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={setUntil}
                    onChange={(e) => setSetUntil(e.target.checked)}
                    disabled={busy}
                    className="h-4 w-4 accent-teal-400"
                  />
                  Set new end date (valid until)
                </label>
                {setUntil ? (
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    disabled={busy}
                    className={fieldClass}
                  />
                ) : null}
                <p className="text-[11px] text-zinc-500">
                  Leave the date empty to clear the end date (codes never expire).
                </p>
              </fieldset>

              <fieldset className="space-y-3 rounded-lg border border-white/[0.06] bg-zinc-900/40 p-3">
                <label className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={setFrom}
                    onChange={(e) => setSetFrom(e.target.checked)}
                    disabled={busy}
                    className="h-4 w-4 accent-teal-400"
                  />
                  Set new start date (valid from)
                </label>
                {setFrom ? (
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    disabled={busy}
                    className={fieldClass}
                  />
                ) : null}
              </fieldset>

              <fieldset className="space-y-3 rounded-lg border border-white/[0.06] bg-zinc-900/40 p-3">
                <label className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={setDiscount}
                    onChange={(e) => setSetDiscount(e.target.checked)}
                    disabled={busy}
                    className="h-4 w-4 accent-teal-400"
                  />
                  Set new discount
                </label>
                {setDiscount ? (
                  <div className="grid grid-cols-2 gap-3">
                    <NativeSelect
                      value={discountType}
                      onChange={setDiscountType}
                      disabled={busy}
                    >
                      <option value="percent">Percent (%)</option>
                      <option value="fixed">Fixed (USDC)</option>
                    </NativeSelect>
                    <input
                      type="number"
                      min={0}
                      step={discountType === "percent" ? 1 : 0.01}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      disabled={busy}
                      placeholder="Value"
                      className={fieldClass}
                    />
                  </div>
                ) : null}
              </fieldset>

              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                >
                  {error}
                </div>
              ) : null}
              {done ? (
                <div
                  role="status"
                  className="rounded-lg border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-sm text-teal-200"
                >
                  {done}
                </div>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-3 border-t border-white/[0.06] bg-[#0c0c0e] px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={busy || !selected || nothingChecked || !batches?.length}
            className="inline-flex items-center justify-center rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Applying…"
              : current
                ? `Apply to ${current.count} code${current.count === 1 ? "" : "s"}`
                : "Apply"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
