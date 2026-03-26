"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import { cn } from "@/lib/utils";

function TooltipProvider({ children, ...props }) {
  return (
    <RadixTooltip.Provider delayDuration={300} {...props}>
      {children}
    </RadixTooltip.Provider>
  );
}

function Tooltip({ children, ...props }) {
  return <RadixTooltip.Root {...props}>{children}</RadixTooltip.Root>;
}

function TooltipTrigger({ className, ...props }) {
  return <RadixTooltip.Trigger className={className} {...props} />;
}

function TooltipContent({ className, sideOffset = 6, ...props }) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-xs rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </RadixTooltip.Portal>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
