"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import { DownloadSimple, ShareNetwork } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TradeCard } from "./trade-card";

export function ShareTradeDialog({ open, onOpenChange, trade }) {
  const cardRef = useRef(null);
  const containerRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setScale(Math.min(w / 1200, 0.6));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [open]);

  const generate = useCallback(async () => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      return dataUrl;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    const dataUrl = await generate();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `hyperscaled-${trade.ticker}-${trade.direction}-${((trade.returnValue - 1) * 100).toFixed(1)}pct.png`;
    link.href = dataUrl;
    link.click();
  }, [generate, trade]);

  const handleShare = useCallback(async () => {
    const dataUrl = await generate();
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "hyperscaled-trade.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${trade.ticker} ${trade.direction} — Hyperscaled` });
      }
    } catch (e) {
      if (e.name !== "AbortError") throw e;
    }
  }, [generate, trade]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-white/[0.08] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-base font-semibold">Share Trade</DialogTitle>
          <DialogDescription className="sr-only">
            Preview and share your trade result card
          </DialogDescription>
        </DialogHeader>

        <div
          ref={containerRef}
          className="mx-4 mb-4 overflow-hidden rounded-lg border border-white/[0.06]"
        >
          <div
            style={{
              width: 1200 * scale,
              height: 630 * scale,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: 1200,
                height: 630,
              }}
            >
              <TradeCard ref={cardRef} {...trade} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button
            variant="outline"
            className="h-11 gap-2 border-white/[0.1] hover:bg-white/[0.04]"
            onClick={handleDownload}
            disabled={isGenerating}
          >
            <DownloadSimple size={18} weight="bold" />
            {isGenerating ? "Generating..." : "Download PNG"}
          </Button>
          {canShare && (
            <Button
              className="h-11 gap-2 bg-teal-400 text-zinc-950 hover:bg-teal-500"
              onClick={handleShare}
              disabled={isGenerating}
            >
              <ShareNetwork size={18} weight="bold" />
              Share
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
