"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Interval for auto-refreshing Command Center dashboards (matches server-rendered filters). */
export const COMMAND_CENTER_DATA_REFRESH_INTERVAL_MS = 5000;

export function CommandCenterDataPolling({
  intervalMs = COMMAND_CENTER_DATA_REFRESH_INTERVAL_MS,
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, router]);

  return null;
}
