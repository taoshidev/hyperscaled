"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadSimple,
  FileCsv,
  ArrowClockwise,
  DownloadSimple,
} from "@phosphor-icons/react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { bulkImportAffiliates } from "@/app/actions/affiliates";
import {
  parseAffiliateImportCsv,
  buildImportRows,
} from "@/lib/admin/parse-affiliate-csv";
import { toCsv } from "@/lib/admin/csv";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex h-9 w-full rounded-lg border border-white/[0.08] bg-zinc-950/60 px-3 py-1 text-sm text-white placeholder:text-zinc-600 transition-colors [color-scheme:dark] focus-visible:outline-none focus-visible:border-teal-400/40 focus-visible:ring-2 focus-visible:ring-teal-400/20 disabled:cursor-not-allowed disabled:opacity-50";

const CHUNK_SIZE = 200;

const STEP_UPLOAD = "upload";
const STEP_CONFIGURE = "configure";
const STEP_RESULTS = "results";

const SCROLL_PAGE = 50;

/**
 * Reveal rows incrementally as the operator scrolls a table. Keeps the DOM
 * light for very large imports (thousands of rows) while still letting them
 * see the whole list. `resetKey` re-collapses the view when the underlying
 * data changes (e.g. remapping columns).
 */
function useInfiniteVisible(total, resetKey, pageSize = SCROLL_PAGE) {
  const [visible, setVisible] = useState(pageSize);

  useEffect(() => {
    setVisible(pageSize);
  }, [resetKey, pageSize]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      setVisible((v) => (v < total ? Math.min(total, v + pageSize) : v));
    }
  };

  const loadMore = () => setVisible((v) => Math.min(total, v + pageSize));

  return { shown: Math.min(visible, total), onScroll, loadMore };
}

function NativeSelect({ value, onChange, children, disabled, className }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(fieldClass, "appearance-none pr-9", className)}
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

function todayISODate() {
  const d = new Date();
  const offsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

const initialPromo = () => ({
  discountType: "percent",
  discountValue: "30",
  useType: "unlimited",
  maxUses: "",
  validFrom: todayISODate(),
  validUntil: "",
  notes: "",
  batchLabel: "",
});

/** Derive a default batch label from the uploaded file name + date. */
function deriveBatchLabel(fileName) {
  const base = String(fileName || "")
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const stamp = todayISODate();
  return base ? `${base}-${stamp}` : `import-${stamp}`;
}

const initialLink = () => ({ kind: "parent", parentAffiliateId: "", entityMinerHotkey: "" });

export function BulkAffiliateImportModal({
  open,
  onOpenChange,
  parentChoices,
  minerChoices,
}) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(STEP_UPLOAD);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [handleIdx, setHandleIdx] = useState(-1);
  const [codeIdx, setCodeIdx] = useState(-1);
  const [link, setLink] = useState(initialLink());
  const [promo, setPromo] = useState(initialPromo());
  const [onDuplicate, setOnDuplicate] = useState("skip");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [aggregate, setAggregate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) return;
    setStep(STEP_UPLOAD);
    setFileName("");
    setParsed(null);
    setHandleIdx(-1);
    setCodeIdx(-1);
    setLink(initialLink());
    setPromo(initialPromo());
    setOnDuplicate("skip");
    setSubmitting(false);
    setProgress({ done: 0, total: 0 });
    setAggregate(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  const columnsChosen =
    handleIdx >= 0 && codeIdx >= 0 && handleIdx !== codeIdx;

  const previewRows = useMemo(() => {
    if (!parsed || !columnsChosen) return [];
    return buildImportRows(parsed.dataRows, handleIdx, codeIdx);
  }, [parsed, handleIdx, codeIdx, columnsChosen]);

  const validRows = useMemo(
    () => previewRows.filter((r) => r.error == null),
    [previewRows],
  );

  const invalidRows = useMemo(
    () => previewRows.filter((r) => r.error != null),
    [previewRows],
  );

  const handleFile = async (file) => {
    setError(null);
    setAggregate(null);
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const result = parseAffiliateImportCsv(text);
      setParsed(result);
      setHandleIdx(result.handleIdx);
      setCodeIdx(result.codeIdx);
      if (result.fileError) {
        return;
      }
      if (result.dataRows.length === 0) {
        setError("CSV contained no data rows.");
        return;
      }
      setPromo((p) => ({ ...p, batchLabel: deriveBatchLabel(file.name) }));
      setStep(STEP_CONFIGURE);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleImport = async () => {
    setError(null);
    if (!columnsChosen) {
      setError("Map both the handle and code columns first.");
      return;
    }
    if (validRows.length === 0) {
      setError("No valid rows to import.");
      return;
    }

    const payloadLink =
      link.kind === "parent"
        ? {
            kind: "parent",
            parentAffiliateId: link.parentAffiliateId
              ? Number(link.parentAffiliateId)
              : null,
          }
        : link.kind === "tenant"
          ? { kind: "tenant", entityMinerHotkey: link.entityMinerHotkey || null }
          : { kind: "none" };

    if (link.kind === "parent" && !payloadLink.parentAffiliateId) {
      setError("Select a parent affiliate.");
      return;
    }
    if (link.kind === "tenant" && !payloadLink.entityMinerHotkey) {
      setError("Select a tenant.");
      return;
    }

    const discountValueNum = Number(promo.discountValue);
    if (!Number.isFinite(discountValueNum) || discountValueNum <= 0) {
      setError("Enter a positive discount value.");
      return;
    }
    if (promo.useType === "multi_use") {
      const n = Number(promo.maxUses);
      if (!Number.isFinite(n) || n < 1) {
        setError("Multi-use coupons require a max-uses value.");
        return;
      }
    }

    const payloadPromo = {
      discountType: promo.discountType,
      discountValue: discountValueNum,
      useType: promo.useType,
      maxUses: promo.useType === "multi_use" ? Number(promo.maxUses) : null,
      validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString() : null,
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString() : null,
      notes: promo.notes ? promo.notes.trim() : null,
      batchLabel: promo.batchLabel ? promo.batchLabel.trim() : null,
    };

    setSubmitting(true);
    setStep(STEP_RESULTS);
    setProgress({ done: 0, total: validRows.length });

    const merged = {
      requested: 0,
      created: 0,
      skipped: 0,
      errored: 0,
      results: [],
    };

    try {
      for (let offset = 0; offset < validRows.length; offset += CHUNK_SIZE) {
        const chunk = validRows.slice(offset, offset + CHUNK_SIZE).map((r) => ({
          rawHandle: r.rawHandle,
          rawCode: r.rawCode,
          slug: r.slug,
          code: r.code,
        }));
        const res = await bulkImportAffiliates({
          rows: chunk,
          link: payloadLink,
          promo: payloadPromo,
          onDuplicate,
        });
        if (!res?.success) {
          throw new Error(res?.error ?? "Import call failed.");
        }
        merged.requested += res.requested;
        merged.created += res.created;
        merged.skipped += res.skipped;
        merged.errored += res.errored;
        merged.results.push(...res.results);
        setProgress({
          done: Math.min(validRows.length, offset + chunk.length),
          total: validRows.length,
        });
        setAggregate({ ...merged });
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const resetToUpload = () => {
    setStep(STEP_UPLOAD);
    setParsed(null);
    setHandleIdx(-1);
    setCodeIdx(-1);
    setFileName("");
    setAggregate(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadResultsCsv = () => {
    if (!aggregate?.results?.length) return;
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://hyperscaled.com";
    const tenantSlug =
      link.kind === "tenant"
        ? minerChoices.find((m) => m.value === link.entityMinerHotkey)?.slug ?? ""
        : "";

    const headers = ["handle", "slug", "code", "affiliate_link", "status"];
    const rows = aggregate.results.map((r) => {
      let url = "";
      if (r.slug && r.code) {
        const u = new URL("/", origin);
        u.searchParams.set("affiliate", r.slug);
        if (tenantSlug) u.searchParams.set("tenant", tenantSlug);
        u.searchParams.set("promo", r.code);
        url = u.toString();
      }
      const statusLabel =
        r.status === "created"
          ? "created"
          : r.status === "skipped"
            ? r.affiliateAction === "affiliate_link_updated"
              ? "link updated"
              : "skipped"
            : r.error ?? "error";
      return [r.rawHandle ?? "", r.slug ?? "", r.code ?? "", url, statusLabel];
    });

    const csv = toCsv(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `affiliate-import-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-white/[0.08] bg-[#0c0c0e] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:max-w-3xl">
        <DialogHeader className="shrink-0 space-y-2 border-b border-white/[0.06] px-6 pb-4 pt-6 pr-12 text-left">
          <div className="flex items-center gap-1.5">
            <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
              Bulk import
            </span>
          </div>
          <DialogTitle className="text-white">
            Import affiliates from CSV
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            One row per affiliate: <span className="font-mono">user_handle,affiliate_code</span>.
            Each row creates an affiliate (linked to the company you pick below)
            plus a promo coupon using the batch-wide specs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === STEP_UPLOAD ? (
            <UploadPane
              fileName={fileName}
              fileInputRef={fileInputRef}
              onFile={handleFile}
              parsed={parsed}
            />
          ) : null}

          {step === STEP_CONFIGURE && parsed ? (
            <ConfigurePane
              parsed={parsed}
              previewRows={previewRows}
              validRows={validRows}
              invalidRows={invalidRows}
              columnsChosen={columnsChosen}
              handleIdx={handleIdx}
              setHandleIdx={setHandleIdx}
              codeIdx={codeIdx}
              setCodeIdx={setCodeIdx}
              link={link}
              setLink={setLink}
              promo={promo}
              setPromo={setPromo}
              onDuplicate={onDuplicate}
              setOnDuplicate={setOnDuplicate}
              parentChoices={parentChoices}
              minerChoices={minerChoices}
              fileName={fileName}
              onReupload={resetToUpload}
            />
          ) : null}

          {step === STEP_RESULTS ? (
            <ResultsPane
              progress={progress}
              aggregate={aggregate}
              submitting={submitting}
              error={error}
            />
          ) : null}

          {error && step !== STEP_RESULTS ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 gap-3 border-t border-white/[0.06] bg-[#0c0c0e] px-6 py-4 sm:flex-row sm:justify-end">
          {step === STEP_RESULTS ? (
            <>
              <button
                type="button"
                onClick={downloadResultsCsv}
                disabled={submitting || !aggregate?.results?.length}
                className="mr-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-400/30 bg-teal-400/15 px-4 py-2 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-400/25 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DownloadSimple size={14} weight="bold" />
                Download CSV
              </button>
              <button
                type="button"
                onClick={resetToUpload}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
              >
                Import another CSV
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </button>
              {step === STEP_CONFIGURE ? (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!columnsChosen || validRows.length === 0 || submitting}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {columnsChosen
                    ? `Import ${validRows.length} affiliate${validRows.length === 1 ? "" : "s"}`
                    : "Map columns to continue"}
                </button>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadPane({ fileName, fileInputRef, onFile, parsed }) {
  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] bg-zinc-950/40 px-6 py-10 text-center transition-colors hover:border-teal-400/30 hover:bg-teal-400/[0.04] focus-visible:border-teal-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/20"
      >
        <UploadSimple size={28} weight="bold" className="text-teal-400" />
        <div className="text-sm font-medium text-white">
          {fileName ? fileName : "Click to select a CSV"}
        </div>
        <div className="text-[11px] text-zinc-500">
          Expected columns: <span className="font-mono">user_handle</span> and{" "}
          <span className="font-mono">affiliate_code</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {parsed?.fileError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {parsed.fileError}
        </div>
      ) : null}
    </div>
  );
}

function ConfigurePane({
  parsed,
  previewRows,
  validRows,
  invalidRows,
  columnsChosen,
  handleIdx,
  setHandleIdx,
  codeIdx,
  setCodeIdx,
  link,
  setLink,
  promo,
  setPromo,
  onDuplicate,
  setOnDuplicate,
  parentChoices,
  minerChoices,
  fileName,
  onReupload,
}) {
  const sampleFor = (idx) => {
    if (idx < 0) return "";
    const firstData = parsed.dataRows.find(
      (r) => String(r[idx] ?? "").trim() !== "",
    );
    return firstData ? String(firstData[idx] ?? "").trim() : "";
  };
  const columnLabel = (header, idx) => {
    const name = header && header.trim() ? header.trim() : `Column ${idx + 1}`;
    const sample = sampleFor(idx);
    return sample ? `${name}  (e.g. ${sample})` : name;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-zinc-950/40 px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <FileCsv size={16} weight="bold" className="text-teal-400" />
          <span className="font-mono text-xs">{fileName}</span>
          <span className="text-[11px] text-zinc-500">
            {parsed.dataRows.length} row{parsed.dataRows.length === 1 ? "" : "s"} parsed
            {columnsChosen ? (
              <>
                {" "}
                · <span className="text-teal-300">{validRows.length} valid</span>
                {invalidRows.length > 0 ? (
                  <span className="text-red-300"> · {invalidRows.length} invalid</span>
                ) : null}
              </>
            ) : null}
          </span>
        </div>
        <button
          type="button"
          onClick={onReupload}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-zinc-900/70 px-2.5 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <ArrowClockwise size={12} weight="bold" />
          Re-upload
        </button>
      </div>

      <section className="space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
          Column mapping
        </h3>
        {!parsed.autoDetected ? (
          <p className="text-[11px] text-amber-300/80">
            Couldn&apos;t auto-detect the columns from the headers. Pick which
            column holds the handle and which holds the promo code.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Handle column</Label>
            <NativeSelect
              value={handleIdx >= 0 ? String(handleIdx) : ""}
              onChange={(v) => setHandleIdx(v === "" ? -1 : Number(v))}
            >
              <option value="">— Select column —</option>
              {parsed.headers.map((h, i) => (
                <option key={`h-${i}`} value={String(i)} disabled={i === codeIdx}>
                  {columnLabel(h, i)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Affiliate / promo code column</Label>
            <NativeSelect
              value={codeIdx >= 0 ? String(codeIdx) : ""}
              onChange={(v) => setCodeIdx(v === "" ? -1 : Number(v))}
            >
              <option value="">— Select column —</option>
              {parsed.headers.map((h, i) => (
                <option key={`c-${i}`} value={String(i)} disabled={i === handleIdx}>
                  {columnLabel(h, i)}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
          Company link
        </h3>
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <NativeSelect
            value={link.kind}
            onChange={(v) =>
              setLink({ kind: v, parentAffiliateId: "", entityMinerHotkey: "" })
            }
          >
            <option value="parent">Parent affiliate</option>
            <option value="tenant">Tenant (entity miner)</option>
            <option value="none">None (top level)</option>
          </NativeSelect>
          {link.kind === "parent" ? (
            <NativeSelect
              value={link.parentAffiliateId}
              onChange={(v) => setLink({ ...link, parentAffiliateId: v })}
            >
              <option value="">— Select parent affiliate —</option>
              {parentChoices.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
          ) : null}
          {link.kind === "tenant" ? (
            <NativeSelect
              value={link.entityMinerHotkey}
              onChange={(v) => setLink({ ...link, entityMinerHotkey: v })}
            >
              <option value="">— Select tenant —</option>
              {minerChoices.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                  {m.slug ? `  (?tenant=${m.slug})` : ""}
                </option>
              ))}
            </NativeSelect>
          ) : null}
          {link.kind === "none" ? (
            <div className="flex h-9 items-center text-xs text-zinc-500">
              Imported rows will be top-level (no parent, no tenant).
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
          Promo code specs
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-zinc-300">Discount type</Label>
            <NativeSelect
              value={promo.discountType}
              onChange={(v) => setPromo({ ...promo, discountType: v })}
            >
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (USDC)</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">
              Value {promo.discountType === "percent" ? "(%)" : "(USDC)"}
            </Label>
            <input
              type="number"
              min={0}
              step={promo.discountType === "percent" ? 1 : 0.01}
              value={promo.discountValue}
              onChange={(e) => setPromo({ ...promo, discountValue: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Use type</Label>
            <NativeSelect
              value={promo.useType}
              onChange={(v) => setPromo({ ...promo, useType: v, maxUses: v === "multi_use" ? promo.maxUses : "" })}
            >
              <option value="unlimited">Unlimited</option>
              <option value="multi_use">Multi-use (max N)</option>
              <option value="one_time">One-time</option>
            </NativeSelect>
          </div>
          {promo.useType === "multi_use" ? (
            <div className="space-y-2">
              <Label className="text-zinc-300">Max uses</Label>
              <input
                type="number"
                min={1}
                step={1}
                value={promo.maxUses}
                onChange={(e) => setPromo({ ...promo, maxUses: e.target.value })}
                className={fieldClass}
              />
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-zinc-300">Valid from (optional)</Label>
            <input
              type="date"
              value={promo.validFrom}
              onChange={(e) => setPromo({ ...promo, validFrom: e.target.value })}
              className={cn(fieldClass, "date-field relative")}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Valid until (optional)</Label>
            <input
              type="date"
              value={promo.validUntil}
              onChange={(e) => setPromo({ ...promo, validUntil: e.target.value })}
              className={cn(fieldClass, "date-field relative")}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Batch label</Label>
            <input
              type="text"
              value={promo.batchLabel}
              onChange={(e) => setPromo({ ...promo, batchLabel: e.target.value })}
              placeholder="e.g. beanstock-2026-07"
              className={fieldClass}
            />
            <p className="text-[11px] text-zinc-500">
              Tags every code in this import so you can later filter and
              bulk-edit the whole cohort (e.g. shift the end date).
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Notes (optional)</Label>
            <input
              type="text"
              value={promo.notes}
              onChange={(e) => setPromo({ ...promo, notes: e.target.value })}
              placeholder="e.g. Beanstock partner cohort, summer 2026"
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
          On duplicate slug
        </h3>
        <NativeSelect value={onDuplicate} onChange={setOnDuplicate}>
          <option value="skip">Skip (keep existing affiliate as-is)</option>
          <option value="update_link">
            Update link (re-point existing affiliate to selected parent/tenant)
          </option>
        </NativeSelect>
        <p className="text-[11px] text-zinc-500">
          Coupon codes are never overwritten — a code collision is always reported
          as &quot;skipped&quot; so partner codes distributed elsewhere stay intact.
        </p>
      </section>

      <PreviewSection previewRows={previewRows} columnsChosen={columnsChosen} />
    </div>
  );
}

function PreviewSection({ previewRows, columnsChosen }) {
  const { shown, onScroll, loadMore } = useInfiniteVisible(
    previewRows.length,
    `${columnsChosen}-${previewRows.length}`,
  );

  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
        Preview ({shown} of {previewRows.length})
      </h3>
      {!columnsChosen ? (
        <div className="rounded-lg border border-dashed border-white/[0.1] bg-zinc-950/40 px-3 py-6 text-center text-xs text-zinc-500">
          Select the handle and code columns above to preview the rows.
        </div>
      ) : (
        <>
          <div
            onScroll={onScroll}
            className="max-h-[340px] overflow-y-auto rounded-lg border border-white/[0.06]"
          >
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Handle</th>
                  <th className="px-3 py-2 text-left font-medium">Slug</th>
                  <th className="px-3 py-2 text-left font-medium">Code</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {previewRows.slice(0, shown).map((r) => (
                  <tr key={r.index} className="text-zinc-300">
                    <td className="px-3 py-1.5 font-mono">{r.rawHandle}</td>
                    <td className="px-3 py-1.5 font-mono text-zinc-400">{r.slug || "—"}</td>
                    <td className="px-3 py-1.5 font-mono text-zinc-400">{r.code || "—"}</td>
                    <td className="px-3 py-1.5">
                      {r.error ? (
                        <span className="text-red-300">{r.error}</span>
                      ) : (
                        <span className="text-teal-300">ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shown < previewRows.length ? (
            <button
              type="button"
              onClick={loadMore}
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 py-1.5 text-[11px] text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              Load more ({previewRows.length - shown} remaining)
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

function ResultsPane({ progress, aggregate, submitting, error }) {
  const pct =
    progress.total > 0
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>
            {submitting
              ? `Importing… ${progress.done} / ${progress.total}`
              : `Done — ${progress.done} / ${progress.total}`}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full bg-teal-400 transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </div>
      ) : null}

      {aggregate ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SummaryStat label="Created" value={aggregate.created} tone="teal" />
            <SummaryStat label="Skipped" value={aggregate.skipped} tone="zinc" />
            <SummaryStat label="Errored" value={aggregate.errored} tone="red" />
          </div>

          <ResultsTable results={aggregate.results} />
        </>
      ) : null}
    </div>
  );
}

function ResultsTable({ results }) {
  const { shown, onScroll, loadMore } = useInfiniteVisible(
    results.length,
    results.length,
  );

  return (
    <div className="space-y-2">
      <div
        onScroll={onScroll}
        className="max-h-[340px] overflow-y-auto rounded-lg border border-white/[0.06]"
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Handle</th>
              <th className="px-3 py-2 text-left font-medium">Slug</th>
              <th className="px-3 py-2 text-left font-medium">Code</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {results.slice(0, shown).map((r, idx) => (
              <tr key={`${r.slug ?? "_"}-${idx}`} className="text-zinc-300">
                <td className="px-3 py-1.5 font-mono">{r.rawHandle || "—"}</td>
                <td className="px-3 py-1.5 font-mono text-zinc-400">{r.slug || "—"}</td>
                <td className="px-3 py-1.5 font-mono text-zinc-400">{r.code || "—"}</td>
                <td className="px-3 py-1.5">
                  {r.status === "created" ? (
                    <span className="text-teal-300">created</span>
                  ) : r.status === "skipped" ? (
                    <span className="text-zinc-400">
                      {r.affiliateAction === "affiliate_link_updated"
                        ? "link updated"
                        : "skipped"}
                      {r.couponAction === "coupon_existed" ? " (code existed)" : ""}
                    </span>
                  ) : (
                    <span className="text-red-300">{r.error ?? "error"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown < results.length ? (
        <button
          type="button"
          onClick={loadMore}
          className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 py-1.5 text-[11px] text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          Load more ({results.length - shown} remaining)
        </button>
      ) : null}
    </div>
  );
}

function SummaryStat({ label, value, tone }) {
  const toneClass =
    tone === "teal"
      ? "text-teal-300 border-teal-400/20 bg-teal-400/10"
      : tone === "red"
        ? "text-red-300 border-red-500/20 bg-red-500/10"
        : "text-zinc-300 border-white/[0.08] bg-zinc-900/60";
  return (
    <div className={cn("rounded-lg border px-3 py-2", toneClass)}>
      <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
