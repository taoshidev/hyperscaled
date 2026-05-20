"use client";

import { useEffect, useState } from "react";

export function useRegistrationCapacity(minerSlug) {
  const slug =
    typeof minerSlug === "string" && minerSlug.trim()
      ? minerSlug.trim()
      : undefined;

  const [capacity, setCapacity] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const qs = slug ? `?miner=${encodeURIComponent(slug)}` : "";
    fetch(`/api/register/capacity${qs}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setCapacity(data);
      })
      .catch(() => {
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

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
