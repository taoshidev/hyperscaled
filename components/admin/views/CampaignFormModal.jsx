"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "@phosphor-icons/react";
import {
  createCampaign,
  updateCampaign,
} from "@/app/actions/admin/campaigns";
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

function CheckboxBox({ checked }) {
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
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
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

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(local) {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d;
}

function defaultStarts() {
  const d = new Date();
  d.setSeconds(0, 0);
  return toLocalInput(d.toISOString());
}

function defaultEnds() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setSeconds(0, 0);
  return toLocalInput(d.toISOString());
}

export function CampaignFormModal({
  open,
  onClose,
  editing,
  couponChoices,
  tierChoices,
  tenantChoices,
  onSaved,
}) {
  const isEdit = Boolean(editing?.id);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [startsAt, setStartsAt] = useState(defaultStarts());
  const [endsAt, setEndsAt] = useState(defaultEnds());
  const [tenantHotkeys, setTenantHotkeys] = useState([]);
  const [couponMode, setCouponMode] = useState("existing");
  const [couponId, setCouponId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscountType, setCouponDiscountType] = useState("percent");
  const [couponDiscountValue, setCouponDiscountValue] = useState("55");
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerText, setBannerText] = useState("");
  const [activateNow, setActivateNow] = useState(false);
  const [overrides, setOverrides] = useState([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    if (editing?.id) {
      setName(editing.name ?? "");
      setSlug(editing.slug ?? "");
      setStartsAt(toLocalInput(editing.startsAt));
      setEndsAt(toLocalInput(editing.endsAt));
      setTenantHotkeys(
        Array.isArray(editing.entityMinerHotkeys)
          ? editing.entityMinerHotkeys
          : [],
      );
      setCouponMode("existing");
      setCouponId(editing.couponId ?? "");
      setCouponCode(editing.couponCode ?? "");
      setCouponDiscountType(editing.couponDiscountType ?? "percent");
      setCouponDiscountValue(
        editing.couponDiscountValue == null
          ? ""
          : String(editing.couponDiscountValue),
      );
      setBannerEnabled(Boolean(editing.bannerEnabled ?? true));
      setBannerText(editing.bannerText ?? "");
      setActivateNow(editing.status === "active");
      setNotes(editing.notes ?? "");
      const o = editing.tierPriceOverrides ?? null;
      setOverrides(
        o && typeof o === "object"
          ? Object.entries(o).map(([accountSize, price]) => ({
              accountSize: String(accountSize),
              price: String(price),
            }))
          : [],
      );
    } else {
      setName("");
      setSlug("");
      setStartsAt(defaultStarts());
      setEndsAt(defaultEnds());
      setTenantHotkeys([]);
      setCouponMode("existing");
      setCouponId("");
      setCouponCode("");
      setCouponDiscountType("percent");
      setCouponDiscountValue("55");
      setBannerEnabled(true);
      setBannerText("");
      setActivateNow(false);
      setOverrides([]);
      setNotes("");
    }
  }, [editing, open]);

  const couponLookup = useMemo(() => {
    const m = new Map();
    for (const c of couponChoices ?? []) m.set(c.id, c);
    return m;
  }, [couponChoices]);

  const remainingTierChoices = useMemo(() => {
    const used = new Set(overrides.map((o) => String(o.accountSize)));
    return (tierChoices ?? []).filter((t) => !used.has(String(t.accountSize)));
  }, [tierChoices, overrides]);

  const onAddOverride = () => {
    const next = remainingTierChoices[0];
    if (!next) return;
    setOverrides((cur) => [
      ...cur,
      { accountSize: String(next.accountSize), price: "" },
    ]);
  };
  const onChangeOverride = (idx, key, value) => {
    setOverrides((cur) =>
      cur.map((o, i) => (i === idx ? { ...o, [key]: value } : o)),
    );
  };
  const onRemoveOverride = (idx) => {
    setOverrides((cur) => cur.filter((_, i) => i !== idx));
  };

  // "All brands (global)" (hotkey "") is exclusive: selecting it clears the
  // specific picks, and picking any specific tenant turns global off.
  const toggleTenant = (hotkey) => {
    if (!hotkey) {
      setTenantHotkeys([]);
      return;
    }
    setTenantHotkeys((cur) =>
      cur.includes(hotkey)
        ? cur.filter((h) => h !== hotkey)
        : [...cur, hotkey],
    );
  };

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const startsDate = fromLocalInput(startsAt);
      const endsDate = fromLocalInput(endsAt);
      if (!startsDate || !endsDate) {
        throw new Error("Start and end dates are required.");
      }
      const tierPriceOverrides = {};
      for (const o of overrides) {
        const k = String(o.accountSize ?? "").trim();
        const v = Number(o.price);
        if (!k) continue;
        if (!Number.isFinite(v) || v < 0) continue;
        tierPriceOverrides[k] = v;
      }

      const couponInput = {};
      if (couponMode === "existing") {
        if (!couponId) throw new Error("Select an existing coupon.");
        const c = couponLookup.get(couponId);
        couponInput.couponId = couponId;
        if (c) couponInput.couponCode = c.code;
      } else {
        if (!couponCode.trim()) throw new Error("Enter a coupon code.");
        if (
          !Number.isFinite(Number(couponDiscountValue)) ||
          Number(couponDiscountValue) <= 0
        ) {
          throw new Error("Discount value must be > 0.");
        }
        couponInput.couponCode = couponCode.trim().toUpperCase();
        couponInput.couponDiscountType = couponDiscountType;
        couponInput.couponDiscountValue = Number(couponDiscountValue);
      }

      const payload = {
        name: name.trim(),
        slug: slug.trim().toLowerCase() || name.trim().toLowerCase().replace(/\s+/g, "-"),
        startsAt: startsDate,
        endsAt: endsDate,
        entityMinerHotkeys: tenantHotkeys,
        bannerEnabled,
        bannerText: bannerText.trim() || null,
        tierPriceOverrides: Object.keys(tierPriceOverrides).length
          ? tierPriceOverrides
          : null,
        notes: notes.trim() || null,
        status: activateNow ? "active" : isEdit ? editing.status : "draft",
        ...couponInput,
      };

      const result = isEdit
        ? await updateCampaign(editing.id, payload)
        : await createCampaign(payload);
      if (!result.success) {
        setError(result.error ?? "Failed to save campaign.");
        return;
      }
      onSaved?.();
    } catch (e) {
      setError(e?.message ?? "Failed to save campaign.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose?.();
      }}
    >
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#0c0c0e] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-white/[0.06] px-6 pb-4 pt-6 pr-12 text-left">
          <div className="flex items-center gap-1.5">
            <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
              {isEdit ? "Edit campaign" : "New campaign"}
            </span>
          </div>
          <DialogTitle className="text-white">
            {isEdit ? `Edit ${editing.name}` : "Create promotional campaign"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Campaigns drive site-wide promo banners, on-tier strikethrough
            pricing, and the auto-applied coupon at checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Name</Label>
              <input
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="WSB55 Flash Sale"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Slug</Label>
              <input
                className={fieldClass}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="wsb55-flash-sale"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Starts at</Label>
              <input
                type="datetime-local"
                className={fieldClass}
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Ends at</Label>
              <input
                type="datetime-local"
                className={fieldClass}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-zinc-300">Tenants</Label>
              {tenantHotkeys.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setTenantHotkeys([])}
                  className="text-[11px] text-zinc-500 transition-colors hover:text-teal-400"
                >
                  Clear ({tenantHotkeys.length})
                </button>
              ) : null}
            </div>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-white/[0.06] bg-zinc-950/40 p-1">
              <div role="group" aria-label="Tenants" className="grid sm:grid-cols-2">
                {(tenantChoices ?? []).map((t) => {
                  const isGlobal = !t.value;
                  const checked = isGlobal
                    ? tenantHotkeys.length === 0
                    : tenantHotkeys.includes(t.value);
                  return (
                    <button
                      type="button"
                      key={t.value || "global"}
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggleTenant(t.value)}
                      className={cn(
                        "group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30",
                        checked
                          ? "text-teal-300"
                          : "text-zinc-300 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <CheckboxBox checked={checked} />
                      <span className="truncate" title={t.label}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Pick one or more brands, or choose “All brands (global)” to run it
              site-wide. Only one active campaign can target a given tenant at a
              time.
            </p>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-zinc-950 accent-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30"
              checked={activateNow}
              onChange={(e) => setActivateNow(e.target.checked)}
            />
            Activate immediately
          </label>

          <div className="space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-3">
              <Label className="text-zinc-300">Coupon</Label>
              <div className="flex rounded-md border border-white/[0.08] bg-zinc-950/60 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCouponMode("existing")}
                  className={cn(
                    "rounded-sm px-2 py-1 transition-colors",
                    couponMode === "existing"
                      ? "bg-teal-400/20 text-teal-300"
                      : "text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  Existing
                </button>
                <button
                  type="button"
                  onClick={() => setCouponMode("create")}
                  className={cn(
                    "rounded-sm px-2 py-1 transition-colors",
                    couponMode === "create"
                      ? "bg-teal-400/20 text-teal-300"
                      : "text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  Create new
                </button>
              </div>
            </div>
            {couponMode === "existing" ? (
              <NativeSelect value={couponId} onChange={setCouponId}>
                <option value="">Select a coupon…</option>
                {(couponChoices ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.discountType === "percent"
                      ? `${c.discountValue}%`
                      : `$${c.discountValue}`}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <Label className="text-zinc-300">Code</Label>
                  <input
                    className={fieldClass}
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="WSB55"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Type</Label>
                  <NativeSelect
                    value={couponDiscountType}
                    onChange={setCouponDiscountType}
                  >
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed (USDC)</option>
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Value</Label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    className={fieldClass}
                    value={couponDiscountValue}
                    onChange={(e) => setCouponDiscountValue(e.target.value)}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-zinc-500">
              The coupon&apos;s validity window is synced to the campaign window
              so checkout validation matches the banner.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">Banner</Label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-zinc-950 accent-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30"
                  checked={bannerEnabled}
                  onChange={(e) => setBannerEnabled(e.target.checked)}
                />
                Enable storefront banner
              </label>
            </div>
            <input
              className={fieldClass}
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="WallStreetBets x Vanta — 55% off all challenges"
            />
          </div>

          <div className="space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">Per-tier price overrides</Label>
              <button
                type="button"
                onClick={onAddOverride}
                disabled={remainingTierChoices.length === 0}
                className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/[0.06] disabled:opacity-50"
              >
                <Plus size={12} />
                Add override
              </button>
            </div>
            {overrides.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No overrides — every tier uses the linked coupon&apos;s discount.
              </p>
            ) : (
              <div className="space-y-2">
                {overrides.map((o, idx) => {
                  const tierOptions = [
                    ...(tierChoices ?? []).filter(
                      (t) =>
                        String(t.accountSize) === String(o.accountSize) ||
                        !overrides.some(
                          (oo, i) =>
                            i !== idx &&
                            String(oo.accountSize) === String(t.accountSize),
                        ),
                    ),
                  ];
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
                    >
                      <NativeSelect
                        value={o.accountSize}
                        onChange={(v) => onChangeOverride(idx, "accountSize", v)}
                      >
                        {tierOptions.map((t) => (
                          <option key={t.accountSize} value={String(t.accountSize)}>
                            {t.label}
                          </option>
                        ))}
                      </NativeSelect>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="Price (USDC)"
                        className={fieldClass}
                        value={o.price}
                        onChange={(e) =>
                          onChangeOverride(idx, "price", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveOverride(idx)}
                        aria-label="Remove override"
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-rose-400/20 bg-rose-400/5 text-rose-300 transition-colors hover:bg-rose-400/10"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Notes (internal)</Label>
            <textarea
              rows={2}
              className={cn(fieldClass, "h-auto py-2 leading-snug")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Slack thread, marketing brief, etc."
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-white/[0.06] bg-[#0a0a0c] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className="rounded-lg border border-teal-400/30 bg-teal-400/15 px-4 py-2 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-400/25 disabled:opacity-50"
          >
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create campaign"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
