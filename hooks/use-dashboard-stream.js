"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { reportWarning } from "@/lib/errors";

export function useDashboardStream(hlAddress) {
  const [status, setStatus] = useState("disconnected");
  const queryClient = useQueryClient();
  const esRef = useRef(null);
  const retriesRef = useRef(0);
  const timerRef = useRef(null);
  const hasReportedDisconnectRef = useRef(false);

  const connect = useCallback(() => {
    if (!hlAddress) return;

    if (esRef.current) {
      esRef.current.close();
    }

    setStatus("connecting");
    const es = new EventSource(
      `/api/dashboard/stream?hl_address=${hlAddress}`,
    );
    esRef.current = es;

    es.onopen = () => {
      setStatus("connected");
      retriesRef.current = 0;
      hasReportedDisconnectRef.current = false;
    };

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "dashboard") {
          queryClient.invalidateQueries({ queryKey: ["dashboard", hlAddress] });
        } else if (msg.type === "event") {
          queryClient.setQueryData(["events", hlAddress], (old) => {
            const prev = Array.isArray(old) ? old : [];
            return [msg.data, ...prev];
          });
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setStatus("error");

      if (!hasReportedDisconnectRef.current) {
        hasReportedDisconnectRef.current = true;
        reportWarning("SSE stream disconnected", {
          source: "dashboard-stream",
          userId: hlAddress,
        });
      }

      const delay = Math.min(1000 * 2 ** retriesRef.current, 30000);
      retriesRef.current += 1;
      timerRef.current = setTimeout(connect, delay);
    };
  }, [hlAddress, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setStatus("disconnected");
    };
  }, [connect]);

  return { status };
}
