"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID, gaAvailable } from "@/lib/analytics";

// Fires a GA4 page_view on App Router client-side navigations. The initial
// page load is already counted by gtag('config', ...) in layout.jsx, so the
// first effect run is a no-op to avoid double-counting.
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!gaAvailable() || !pathname) return;
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }, [pathname, searchParams]);

  return null;
}
