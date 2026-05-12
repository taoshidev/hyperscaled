"use client";

import { useEffect, useState } from "react";

/**
 * Client hook: GET /api/register/capacity (browser-safe, short-cached on CDN).
 */
export function useRegistrationCapacity() {
  const [capacity, setCapacity] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/register/capacity", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setCapacity(data);
      })
      .catch(() => {
        /* fail open — same as StepSelectTier */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const freeAtCapacity = Boolean(capacity?.free?.atCapacity);
  const paidAtCapacity = Boolean(capacity?.paid?.atCapacity);
  const registrationFullyClosed = Boolean(
    capacity && freeAtCapacity && paidAtCapacity,
  );

  return {
    capacity,
    freeAtCapacity,
    paidAtCapacity,
    registrationFullyClosed,
  };
}
