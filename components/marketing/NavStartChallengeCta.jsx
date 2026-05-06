"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "@phosphor-icons/react";

import { useBrandHref } from "@/lib/brand";
import { trackCtaClick } from "@/lib/analytics";

// Wallet-aware "Start Challenge" CTA. Hides itself when the connected
// wallet has an active registration — they're already in. Must be
// rendered inside `<Providers>` (uses wagmi + react-query).
export default function NavStartChallengeCta() {
  const brandHref = useBrandHref();
  const { address, isConnected } = useAccount();

  // Connected wallet IS the registered HL address (enforced in /api/register),
  // so we can look up status by address directly. Errors fall through to a
  // visible CTA — this is decorative chrome, not a blocking call.
  const { data, isLoading } = useQuery({
    queryKey: ["nav-registration-status", address],
    queryFn: async () => {
      const res = await fetch(`/api/registration-status?hl_address=${address}`);
      if (!res.ok) return { status: "none" };
      return res.json();
    },
    enabled: isConnected && !!address,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const hideCta =
    isConnected &&
    !!address &&
    !isLoading &&
    data?.status === "active";

  if (hideCta) return null;

  return (
    <Link
      href={brandHref("/register")}
      onClick={() => trackCtaClick({ label: "Start Challenge", location: "nav" })}
      className="shiny-cta px-5 py-2"
    >
      <span className="flex items-center gap-1.5">
        Start Challenge
        <ArrowRight size={15} weight="bold" />
      </span>
    </Link>
  );
}
