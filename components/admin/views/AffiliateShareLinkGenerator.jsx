"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Link as LinkIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex h-9 w-full rounded-lg border border-white/[0.08] bg-zinc-950/60 px-3 py-1 text-sm text-white placeholder:text-zinc-600 transition-colors [color-scheme:dark] focus-visible:outline-none focus-visible:border-teal-400/40 focus-visible:ring-2 focus-visible:ring-teal-400/20";

const PATH_PRESETS = [
  { value: "/", label: "Home /" },
  { value: "/register", label: "/register" },
  { value: "/pricing", label: "/pricing" },
  { value: "/agents", label: "/agents" },
];

export function AffiliateShareLinkGenerator({
  affiliateSlug,
  defaultTenantSlug,
  promoCodes,
}) {
  const [tenant, setTenant] = useState(defaultTenantSlug ?? "");
  const [promo, setPromo] = useState("");
  const [path, setPath] = useState("/");
  const [copied, setCopied] = useState(false);

  const baseOrigin = useMemo(() => {
    if (typeof window === "undefined") return "https://hyperscaled.com";
    return window.location.origin;
  }, []);

  const url = useMemo(() => {
    const u = new URL(path || "/", baseOrigin);
    u.searchParams.set("affiliate", affiliateSlug);
    if (tenant) u.searchParams.set("tenant", tenant);
    if (promo) u.searchParams.set("promo", promo);
    return u.toString();
  }, [affiliateSlug, baseOrigin, path, promo, tenant]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard might be unavailable on insecure origins
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <LinkIcon size={12} weight="bold" className="text-teal-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
          Share-link generator
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Tenant slug (optional)</label>
          <input
            type="text"
            list="entity-miner-slugs"
            value={tenant}
            onChange={(e) => setTenant(e.target.value.trim())}
            placeholder="e.g. lunarcrush-trading"
            className={cn(fieldClass, "font-mono")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Promo code (optional)</label>
          <input
            type="text"
            list="promo-codes-list"
            value={promo}
            onChange={(e) => setPromo(e.target.value.trim().toUpperCase())}
            placeholder="e.g. SUMMER25"
            className={cn(fieldClass, "font-mono")}
          />
          <datalist id="promo-codes-list">
            {(promoCodes ?? []).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Landing path</label>
          <input
            type="text"
            list="path-presets"
            value={path}
            onChange={(e) => setPath(e.target.value || "/")}
            className={cn(fieldClass, "font-mono")}
          />
          <datalist id="path-presets">
            {PATH_PRESETS.map((p) => (
              <option key={p.value} value={p.value} label={p.label} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="mt-3 flex items-stretch gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(fieldClass, "flex-1 font-mono text-xs")}
        />
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
            copied
              ? "border-teal-400/40 bg-teal-400/15 text-teal-300"
              : "border-white/[0.08] bg-zinc-900/70 text-zinc-300 hover:bg-white/[0.04] hover:text-white",
          )}
        >
          {copied ? (
            <>
              <Check size={13} weight="bold" />
              Copied
            </>
          ) : (
            <>
              <Copy size={13} weight="bold" />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        First-touch attribution: the visitor&apos;s subsequent signup is credited
        to <span className="font-mono text-zinc-400">{affiliateSlug}</span>
        {tenant ? (
          <>
            {" "}
            under tenant{" "}
            <span className="font-mono text-zinc-400">{tenant}</span>
          </>
        ) : null}
        {promo ? (
          <>
            {" "}
            with promo{" "}
            <span className="font-mono text-zinc-400">{promo}</span>
          </>
        ) : null}
        .
      </p>
    </div>
  );
}
