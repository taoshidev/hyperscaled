"use client";

import { useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ShareTradeDialog } from "./share-trade-dialog";

export function ShareButton({ trade }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
            aria-label="Share trade"
          >
            <ShareNetwork size={16} weight="bold" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Share trade</TooltipContent>
      </Tooltip>
      <ShareTradeDialog open={open} onOpenChange={setOpen} trade={trade} />
    </>
  );
}
