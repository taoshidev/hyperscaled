"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { endCampaign } from "@/app/actions/admin/campaigns";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex h-9 w-full rounded-lg border border-white/[0.08] bg-zinc-950/60 px-3 py-1 text-sm text-white placeholder:text-zinc-600 transition-colors [color-scheme:dark] focus-visible:outline-none focus-visible:border-teal-400/40 focus-visible:ring-2 focus-visible:ring-teal-400/20 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Destructive-action confirmation for ending a campaign. The admin must type
 * the campaign's exact name before the confirm button enables, mirroring the
 * "type to confirm" pattern used for other irreversible operations.
 */
export function CampaignEndDialog({ campaign, open, onClose, onEnded }) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setError(null);
      setBusy(false);
    }
  }, [open, campaign?.id]);

  const expectedName = (campaign?.name ?? "").trim();
  const matches = expectedName.length > 0 && confirmText.trim() === expectedName;

  const onConfirm = async () => {
    if (!campaign || !matches) return;
    setBusy(true);
    setError(null);
    try {
      const res = await endCampaign(campaign.id);
      if (!res.success) {
        setError(res.error ?? "Failed to end campaign.");
        return;
      }
      onEnded?.();
    } catch (e) {
      setError(e?.message ?? "Failed to end campaign.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !busy) onClose?.();
      }}
    >
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="border-white/[0.08] bg-[#0c0c0e] shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:max-w-md"
      >
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-white">End campaign</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Ending{" "}
            <span className="font-medium text-zinc-200">{campaign?.name}</span>{" "}
            stops its storefront banner and promo pricing immediately and sets
            its end date to now. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-zinc-300">
            Type{" "}
            <span className="font-mono font-semibold text-teal-300">
              {expectedName}
            </span>{" "}
            to confirm
          </Label>
          <input
            className={fieldClass}
            value={confirmText}
            autoComplete="off"
            disabled={busy}
            placeholder={expectedName}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches) onConfirm();
            }}
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2">
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
            onClick={onConfirm}
            disabled={!matches || busy}
            className="rounded-lg border border-rose-400/30 bg-rose-400/15 px-4 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-400/25 disabled:opacity-50"
          >
            {busy ? "Ending…" : "End campaign"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
