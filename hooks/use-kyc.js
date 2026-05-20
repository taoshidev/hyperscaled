"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchJSON(url, init = {}) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = new Error("Fetch failed");
    err.status = res.status;
    try {
      const body = await res.json();
      err.message = body.error || err.message;
    } catch {
      // Body is not JSON — keep generic err.message.
    }
    throw err;
  }
  return res.json();
}

/**
 * `GET /api/kyc/status` is a public read — same trust model as the rest
 * of the dashboard endpoints. Returns the account's verification state
 * as a transparency signal.
 */
export function useKycStatus(hlAddress) {
  return useQuery({
    queryKey: ["kyc-status", hlAddress],
    queryFn: () => fetchJSON(`/api/kyc/status?wallet=${hlAddress}`),
    enabled: !!hlAddress,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useKycToken(wallet, connectedWallet) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/kyc/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, connectedWallet }),
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
