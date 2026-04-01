"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useRegistrationHelp } from "./registration-help-context";
import { HelpPanel } from "./help-panel";
import { HELP_CONTENT } from "./help-content";

export function SidebarContent({ collapsed, onToggle }) {
  const { activeHelp } = useRegistrationHelp();

  const key = activeHelp || "default";
  const entry = HELP_CONTENT[key];
  const showCtx = activeHelp && entry;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-border bg-[oklch(0.05_0_0)] py-4 px-1 gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand help panel"
          className="
            flex items-center justify-center w-8 h-8 rounded-lg
            bg-[oklch(0.2_0_0)] border border-border
            text-muted-foreground hover:text-foreground hover:border-white/[0.15]
            transition-[color,border-color] duration-150 cursor-pointer
            outline-none focus-visible:ring-2 focus-visible:ring-teal-400
            focus-visible:ring-offset-2 focus-visible:ring-offset-background
          "
        >
          <CaretLeft size={14} weight="bold" />
        </button>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted-foreground"
          style={{ writingMode: "vertical-rl" }}
        >
          Help
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[calc(100dvh-4rem)] rounded-xl border border-border bg-[oklch(0.05_0_0)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-border shrink-0">
        <span className="text-sm font-bold text-foreground tracking-tight">
          Help
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse help panel"
          className="
            flex items-center justify-center w-7 h-7 rounded-lg
            text-muted-foreground hover:text-foreground
            transition-[color] duration-150 cursor-pointer
            outline-none focus-visible:ring-2 focus-visible:ring-teal-400
            focus-visible:ring-offset-2 focus-visible:ring-offset-background
          "
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {/* Context bar */}
      {showCtx && (
        <div className="px-5 py-2 bg-[oklch(0.5_0.15_160/8%)] border-b border-[oklch(0.5_0.15_160/20%)] shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-teal-400">
            Help for: {entry.title}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-[18px] scrollbar-hide">
        <HelpPanel helpId={activeHelp} />
      </div>
    </div>
  );
}
