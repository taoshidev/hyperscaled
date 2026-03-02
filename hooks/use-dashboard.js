"use client";

import { useQuery } from "@tanstack/react-query";

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

export function useDashboardData(hlAddress) {
  const enabled = !!hlAddress;

  const dashboard = useQuery({
    queryKey: ["dashboard", hlAddress],
    queryFn: () => fetchJSON(`/api/dashboard?hl_address=${hlAddress}`),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const events = useQuery({
    queryKey: ["events", hlAddress],
    queryFn: () => fetchJSON(`/api/dashboard/events?hl_address=${hlAddress}`),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return { dashboard, events };
}
