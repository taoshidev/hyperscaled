"use client";

import { useCallback, useState } from "react";
import { Plus, Sparkle } from "@phosphor-icons/react";
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
import { createCoupon, createCouponsBatch } from "@/app/actions/coupons";
import { cn } from "@/lib/utils";

const RANDOM_PREFIX = "HS";

const randomCode = () =>
  `${RANDOM_PREFIX}-` +
  Array.from({ length: 2 }, () =>
    Math.random().toString(36).slice(2, 6).toUpperCase(),
  ).join("-");

function parseEmailLines(raw) {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseMaxUsesInput(useType, raw) {
  if (useType === "one_time") return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

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

function FieldInput(props) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

function TierCheckbox({ checked }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked
          ? "border-teal-400 bg-teal-400 text-black"
          : "border-white/20 bg-zinc-950/60",
      )}
    >
      {checked ? (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 5.2l2 2L8 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

export function CouponCreateButtonModal({ tierChoices }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [useType, setUseType] = useState("one_time");
  const [validUntil, setValidUntil] = useState("");
  const [batchCount, setBatchCount] = useState(1);
  const [tierValues, setTierValues] = useState([]);
  const [emailsRaw, setEmailsRaw] = useState("");
  const [maxUsesInput, setMaxUsesInput] = useState("");

  const resetFields = useCallback(() => {
    setCode("");
    setDiscountType("percent");
    setDiscountValue("10");
    setUseType("one_time");
    setValidUntil("");
    setBatchCount(1);
    setTierValues([]);
    setEmailsRaw("");
    setMaxUsesInput("");
    setError(null);
  }, []);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) resetFields();
  };

  const toggleTier = (value) => {
    setTierValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    const allowedTierIds = tierValues.length > 0 ? tierValues : null;
    const allowedEmails = (() => {
      const list = parseEmailLines(emailsRaw);
      return list.length > 0 ? list : null;
    })();
    const maxUses = parseMaxUsesInput(useType, maxUsesInput);
    const validUntilDate = validUntil ? new Date(validUntil) : null;

    try {
      if (batchCount <= 1) {
        const finalCode = code.trim() || randomCode();
        const result = await createCoupon({
          code: finalCode,
          discountType,
          discountValue: Number(discountValue) || 0,
          useType,
          validUntil: validUntilDate,
          allowedTierIds,
          allowedEmails,
          maxUses,
        });
        if (result.success) {
          handleOpenChange(false);
          router.refresh();
        } else {
          setError(result.error);
        }
      } else {
        const result = await createCouponsBatch({
          discountType,
          discountValue: Number(discountValue) || 0,
          useType,
          validUntil: validUntilDate,
          count: batchCount,
          allowedTierIds,
          allowedEmails,
          maxUses,
        });
        if (result.success) {
          handleOpenChange(false);
          router.refresh();
        } else {
          setError(
            result.created
              ? `${result.error} (${result.created} of ${result.requested ?? batchCount} created before the error — list refreshed to reflect what landed)`
              : result.error,
          );
          if (result.created) router.refresh();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-400/30 bg-teal-400/15 px-3.5 py-2 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-400/25 hover:text-teal-200"
      >
        <Plus size={14} weight="bold" />
        Add coupon
      </button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[min(760px,92dvh)] flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#0c0c0e] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:max-w-xl">
          <DialogHeader className="shrink-0 space-y-2 border-b border-white/[0.06] px-6 pb-4 pt-6 pr-12 text-left">
            <div className="flex items-center gap-1.5">
              <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
                New code
              </span>
            </div>
            <DialogTitle className="text-white">Create coupon</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Codes are normalized to uppercase. Leave tier or email scopes empty
              to allow anyone at checkout who meets the other rules.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-zinc-300">Code</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <FieldInput
                      placeholder="Leave blank to auto-generate"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={batchCount > 1}
                      className="min-w-0 flex-1 font-mono"
                    />
                    <button
                      type="button"
                      className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 text-sm text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      onClick={() => setCode(randomCode())}
                      disabled={batchCount > 1 || loading}
                    >
                      <Sparkle size={14} weight="bold" />
                      Generate
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:col-span-2 md:grid-cols-3">
                  <div className="min-w-0 space-y-2">
                    <Label className="text-zinc-300">Discount type</Label>
                    <NativeSelect
                      value={discountType}
                      onChange={setDiscountType}
                      disabled={loading}
                    >
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed ($)</option>
                    </NativeSelect>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label className="text-zinc-300">Use type</Label>
                    <NativeSelect
                      value={useType}
                      onChange={(v) => {
                        setUseType(v);
                        if (v === "one_time") setMaxUsesInput("");
                      }}
                      disabled={loading}
                    >
                      <option value="one_time">One time</option>
                      <option value="multi_use">Multi use</option>
                      <option value="unlimited">Unlimited</option>
                    </NativeSelect>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label className="text-zinc-300">Discount value</Label>
                    <FieldInput
                      type="number"
                      min={0}
                      step={0.01}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="space-y-1.5 rounded-lg border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-xs leading-snug text-zinc-400">
                    <p>
                      <span className="font-medium text-white">Multi use</span>{" "}
                      means the same code can redeem multiple times until{" "}
                      <span className="font-medium text-white">Max redemptions</span>{" "}
                      is reached. Use this for finite shared promos (e.g. 100 uses).
                    </p>
                    <p>
                      <span className="font-medium text-white">Unlimited</span> is
                      the same mechanically but assumes no max redemptions cap.
                    </p>
                    <p>
                      <span className="font-medium text-white">One time</span>{" "}
                      allows a single successful checkout per code.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Number of codes</Label>
                  <FieldInput
                    type="number"
                    min={1}
                    max={100}
                    value={batchCount}
                    onChange={(e) =>
                      setBatchCount(
                        Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)),
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Valid until (optional)</Label>
                  <FieldInput
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-zinc-300">Max redemptions</Label>
                  <FieldInput
                    type="number"
                    min={1}
                    placeholder="Leave empty for unlimited total uses"
                    value={maxUsesInput}
                    disabled={useType === "one_time"}
                    onChange={(e) => setMaxUsesInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <Label className="text-zinc-300">Allowed tiers</Label>
                  {tierValues.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setTierValues([])}
                      className="text-[11px] text-zinc-500 transition-colors hover:text-teal-400"
                    >
                      Clear ({tierValues.length})
                    </button>
                  ) : null}
                </div>
                {tierChoices.length === 0 ? (
                  <p className="text-xs text-zinc-500">No active tiers found.</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-white/[0.06] bg-zinc-950/40 p-1">
                    <div
                      role="group"
                      aria-label="Allowed tiers"
                      className="grid sm:grid-cols-2"
                    >
                      {tierChoices.map((opt) => {
                        const checked = tierValues.includes(opt.value);
                        return (
                          <button
                            type="button"
                            key={opt.value}
                            role="checkbox"
                            aria-checked={checked}
                            disabled={loading}
                            onClick={() => toggleTier(opt.value)}
                            className={cn(
                              "group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30",
                              checked
                                ? "text-teal-300"
                                : "text-zinc-300 hover:bg-white/[0.04] hover:text-white",
                            )}
                          >
                            <TierCheckbox checked={checked} />
                            <span className="truncate" title={opt.label}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="text-xs text-zinc-500">
                  Tier values are stored as <code className="rounded bg-zinc-900/70 px-1 py-0.5 font-mono text-[11px] text-zinc-400">{`{miner-slug}:{account-size}`}</code>;
                  empty selection means any tier may redeem.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Allowed emails</Label>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-white/[0.08] bg-zinc-950/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 transition-colors [color-scheme:dark] focus-visible:outline-none focus-visible:border-teal-400/40 focus-visible:ring-2 focus-visible:ring-teal-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="One email per line, or comma-separated"
                  value={emailsRaw}
                  onChange={(e) => setEmailsRaw(e.target.value)}
                  disabled={loading}
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
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t border-white/[0.06] bg-[#0c0c0e] px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating…"
                : batchCount > 1
                  ? `Create ${batchCount} coupons`
                  : "Create coupon"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
