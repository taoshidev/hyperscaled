import { TableHeader } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const adminTableHeadClass =
  "bg-zinc-900/80 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold";

export const adminHeaderRowClass =
  "border-b border-white/[0.06] hover:bg-transparent data-[state=selected]:bg-transparent";

export function AdminTablePageRoot({ children }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      {children}
    </div>
  );
}

export function AdminTableScrollCard({ children, className }) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/40 shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]",
        className,
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}

export function AdminTableEmptyState({ children }) {
  return (
    <div className="flex min-h-[min(360px,55dvh)] w-full flex-1 flex-col items-center justify-center px-4 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

export function AdminStickyTableHeader(props) {
  return (
    <TableHeader
      className={cn(
        "sticky top-0 z-20 border-b border-white/[0.06] bg-zinc-900/95 backdrop-blur-md [&_th]:bg-transparent",
        props.className,
      )}
      {...props}
    />
  );
}

export function AdminTablePaginationBar({ children, className }) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-between gap-3 text-sm text-zinc-500",
        className,
      )}
    >
      {children}
    </div>
  );
}
