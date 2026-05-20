import Link from "next/link";
import { ArrowDown, ArrowLeftRight, ArrowUp } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function AdminSortableTh({
  className,
  label,
  sortKey,
  activeSort,
  activeDir,
  href,
  align = "left",
}) {
  const active = activeSort === sortKey;
  const Icon = active
    ? activeDir === "desc"
      ? ArrowDown
      : ArrowUp
    : ArrowLeftRight;

  return (
    <TableHead className={cn(className, align === "right" && "text-right")}>
      <Link
        href={href}
        title={`Sort by ${label}`}
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40",
          align === "right" && "w-full justify-end",
          active ? "text-teal-400" : "text-zinc-500",
        )}
      >
        <span>{label}</span>
        <Icon className="size-3.5 shrink-0 opacity-90" aria-hidden />
      </Link>
    </TableHead>
  );
}
