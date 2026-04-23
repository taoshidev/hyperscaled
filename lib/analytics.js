// Google Analytics 4 — single source of truth for measurement ID + event helpers.
// If you rotate the GA4 property, change it once here.
export const GA_MEASUREMENT_ID = "G-RQ1DQ8YREL";

export function gaAvailable() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

// Fire a page_view event. Used by the app-wide route-change tracker and by
// referral landing pages that want an explicit page_view with extra params.
export function trackPageView({ path, title, location, extra = {} }) {
  if (!gaAvailable()) return;
  window.gtag("event", "page_view", {
    page_title: title,
    page_location:
      location ||
      (typeof window !== "undefined" ? window.location.origin + path : path),
    page_path: path,
    ...extra,
  });
}
