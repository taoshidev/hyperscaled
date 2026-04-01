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

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error("Fetch failed");
    err.status = res.status;
    try {
      const b = await res.json();
      err.message = b.error || err.message;
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

export function usePayoutData(subaccountUuid) {
  const enabled = !!subaccountUuid;

  // Query the current payout period (last 30 days as default window)
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400000;

  return useQuery({
    queryKey: ["payout", subaccountUuid],
    queryFn: () =>
      postJSON("/api/dashboard/payout", {
        subaccount_uuid: subaccountUuid,
        start_time_ms: thirtyDaysAgo,
        end_time_ms: now,
      }),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
