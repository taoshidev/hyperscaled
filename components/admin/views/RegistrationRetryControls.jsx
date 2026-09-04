"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { retryRegistrations } from "@/app/actions/registrations";
import { describeRetryResult, summarizeRetryResults } from "@/lib/registrations/retry-result-text";
import { cn } from "@/lib/utils";

const primaryButtonClass =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-teal-400/30 bg-teal-400/15 px-3 text-sm font-medium text-teal-300 transition-colors hover:bg-teal-400/25 disabled:cursor-not-allowed disabled:opacity-50";

const rowButtonClass =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.08] bg-zinc-900/70 px-2.5 text-xs text-zinc-300 transition-colors hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

function toneClass(type) {
  if (type === "error") return "text-red-300";
  if (type === "success") return "text-teal-300";
  return "text-zinc-400";
}

/**
 * Always-mounted live region so screen readers announce outcome changes
 * (a region that appears together with its text is not announced).
 */
function StatusLine({ status, className }) {
  return (
    <p role="status" aria-live="polite" className={cn("min-h-[1rem] text-xs", toneClass(status?.type), className)}>
      {status?.message ?? ""}
    </p>
  );
}

/** Header button: re-drives every `pending` registration. */
export function RetryAllPendingButton({ pendingCount }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(null);

  const run = () => {
    setStatus({ type: "info", message: "Retrying…" });
    startTransition(async () => {
      const result = await retryRegistrations();
      if (!result.success) {
        setStatus({ type: "error", message: result.error });
        return;
      }
      const summary = summarizeRetryResults(result.results);
      setStatus({
        type: result.results.some((r) => r.status === "registered") ? "success" : "info",
        message: result.budgetExhausted
          ? `${summary}. Time budget hit — run again for the rest.`
          : summary,
      });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={isPending || pendingCount === 0}
        className={primaryButtonClass}
        title={pendingCount === 0 ? "No pending registrations" : "Re-send create-hl-subaccount for every pending row"}
      >
        <ArrowsClockwise size={16} weight="bold" className={isPending ? "animate-spin" : undefined} aria-hidden />
        {isPending ? "Retrying…" : `Retry all pending (${pendingCount})`}
      </button>
      <StatusLine status={status} className="text-right" />
    </div>
  );
}

/** Row button: re-drives one `pending` registration. */
export function RetryRowButton({ id }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(null);

  const run = () => {
    setStatus({ type: "info", message: "Retrying…" });
    startTransition(async () => {
      const result = await retryRegistrations({ ids: [id] });
      if (!result.success) {
        setStatus({ type: "error", message: result.error });
        return;
      }
      const first = result.results[0];
      if (!first) {
        setStatus({ type: "info", message: "Already handled — row is no longer pending." });
      } else {
        setStatus({
          type: first.status === "registered" ? "success" : first.status === "failed" ? "error" : "info",
          message: describeRetryResult(first),
        });
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={run} disabled={isPending} className={rowButtonClass}>
        <ArrowsClockwise size={12} weight="bold" className={isPending ? "animate-spin" : undefined} aria-hidden />
        {isPending ? "Retrying…" : "Retry"}
      </button>
      <StatusLine status={status} className="max-w-[16rem] truncate text-right" />
    </div>
  );
}
