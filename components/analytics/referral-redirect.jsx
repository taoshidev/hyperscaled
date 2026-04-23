"use client";

import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

// Reusable KOL/partner referral landing page. To add a new referral route
// (e.g. /twitter, /podcast, /alpha), create app/<slug>/page.jsx that renders
// <ReferralRedirect ref="<slug>" pageTitle="<Title> Referral" pagePath="/<slug>" />.
// The server-side page.jsx should also export `metadata` with
// `robots: { index: false, follow: false }` to keep the referral path out of search.
export function ReferralRedirect({
  refSource,
  pageTitle,
  pagePath,
  redirectTo = "/",
  delayMs = 300,
}) {
  useEffect(() => {
    try {
      sessionStorage.setItem("ref", refSource);
    } catch {
      // sessionStorage can throw in private modes — tracking still fires below.
    }

    trackPageView({
      path: pagePath,
      title: pageTitle,
      extra: { ref_source: refSource },
    });

    const t = setTimeout(() => {
      window.location.replace(redirectTo);
    }, delayMs);

    return () => clearTimeout(t);
  }, [refSource, pageTitle, pagePath, redirectTo, delayMs]);

  return null;
}
