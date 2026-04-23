// Google Analytics 4 — single source of truth for measurement ID + event helpers.
// If you rotate the GA4 property, change it once here.
export const GA_MEASUREMENT_ID = "G-RQ1DQ8YREL";

// Brand is tagged on every GA4 hit so hs.vantatrading.io traffic can be
// segmented from hyperscaled.trade traffic in reports. Must be registered as
// an event-scoped custom dimension in GA4 Admin → Custom definitions for it
// to appear in reports (user-facing name: "Brand", parameter name: "brand").
export function getBrand() {
  if (typeof window === "undefined") return "hyperscaled";
  return /vantatrading/i.test(window.location.hostname) ? "vanta" : "hyperscaled";
}

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
    brand: getBrand(),
    ...extra,
  });
}
