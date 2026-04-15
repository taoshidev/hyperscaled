"use client";

import { useEffect, useState } from "react";
import { HL_API_URL } from "@/lib/constants";

const DEFAULT_POLL_MS = 10_000;

async function fetchHlBalance(address) {
  const [spot, perps] = await Promise.all([
    fetch(`${HL_API_URL}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "spotClearinghouseState", user: address }),
    }).then((r) => r.json()),
    fetch(`${HL_API_URL}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "clearinghouseState", user: address }),
    }).then((r) => r.json()),
  ]);

  const usdcEntry = spot?.balances?.find((b) => b.coin === "USDC");
  const spotAvailable = usdcEntry
    ? parseFloat(usdcEntry.total) - parseFloat(usdcEntry.hold)
    : 0;

  const perpsAccountValue =
    perps?.marginSummary?.accountValue != null
      ? parseFloat(perps.marginSummary.accountValue)
      : perps?.withdrawable != null
        ? parseFloat(perps.withdrawable)
        : 0;

  return (Number.isFinite(spotAvailable) ? spotAvailable : 0) +
    (Number.isFinite(perpsAccountValue) ? perpsAccountValue : 0);
}

export function useHlBalance(address, { pollMs = DEFAULT_POLL_MS, enabled = true } = {}) {
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(address && enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !address) {
      setBalance(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let timerId;

    async function tick() {
      try {
        const value = await fetchHlBalance(address);
        if (cancelled) return;
        setBalance(value);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    setIsLoading(true);
    tick();
    timerId = setInterval(tick, pollMs);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [address, pollMs, enabled]);

  return { balance, isLoading, error };
}
