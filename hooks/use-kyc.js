"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error("Fetch failed");
    err.status = res.status;
    try {
      const body = await res.json();
      err.message = body.error || err.message;
    } catch {}
    throw err;
  }
  return res.json();
}

export function useKycStatus(wallet) {
  return useQuery({
    queryKey: ["kyc-status", wallet],
    queryFn: () => fetchJSON(`/api/kyc/status?wallet=${wallet}`),
    enabled: !!wallet,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useKycToken(wallet) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/kyc/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to get KYC token");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kyc-status", wallet] });
    },
  });
}
