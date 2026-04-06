"use client";

import { useQuery } from "@tanstack/react-query";

export function useHLEquity(address) {
  return useQuery({
    queryKey: ["hl-equity", address],
    queryFn: async () => {
      const res = await fetch(`/api/hl-equity?address=${encodeURIComponent(address)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(body.error || "Failed to fetch equity");
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
    enabled: !!address,
    refetchInterval: 30_000,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}
