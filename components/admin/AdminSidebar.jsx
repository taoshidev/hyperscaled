"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Tag,
  SignOut,
  UsersThree,
  ChartLineUp,
  Megaphone,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/command-center/campaigns",
    label: "Campaigns",
    icon: Megaphone,
  },
  {
    href: "/command-center/promo-codes",
    label: "Promotional codes",
    icon: Tag,
  },
  {
    href: "/command-center/affiliates",
    label: "Affiliates",
    icon: UsersThree,
  },
  {
    href: "/command-center/attributions",
    label: "Attribution",
    icon: ChartLineUp,
  },
];

function shortenWallet(wallet) {
  if (!wallet) return "";
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

export function AdminSidebar({ wallet, role, label }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/command-center/session", { method: "DELETE" });
    } catch {
      // ignore — we redirect regardless so a stuck network never traps the admin
    }
    router.push("/command-center/login");
    router.refresh();
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0c0c0e]">
      <div className="border-b border-white/[0.06] px-5 py-5">
        <Link href="/" className="flex items-center gap-2 mb-4 opacity-90 hover:opacity-100 transition-opacity">
          <img
            src="/hyperscaled-logo.svg"
            alt="Hyperscaled"
            className="h-6 w-auto"
          />
        </Link>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-teal" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
            Command Center
          </span>
        </div>
        <p className="truncate text-sm font-medium text-white">
          {label || shortenWallet(wallet)}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {role === "super_admin" ? "Super admin" : "Admin"}
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-teal-400/10 text-teal-400 border border-teal-400/20"
                  : "border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]",
              )}
            >
              <Icon size={16} weight={active ? "fill" : "regular"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/[0.06] p-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <SignOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
