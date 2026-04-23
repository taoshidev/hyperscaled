// Google Analytics 4 — single source of truth for measurement ID + event helpers.
// If you rotate the GA4 property, change it once here.
//
// ─── Event taxonomy ────────────────────────────────────────────────────────
// All events are auto-tagged with `brand` (hyperscaled | vanta) via the root
// layout's gtag config — no need to pass it explicitly.
//
// Marketing site:
//   cta_click                        Primary CTA button clicks.
//                                    Params: cta_label, cta_location,
//                                            cta_destination, page_path
//   ref_source_set                   KOL landing page visit.
//                                    Params: ref_source
//
// Register funnel (fired in order):
//   register_intent                  User arrives at /register.
//                                    Params: ref_source, brand_variant
//   register_tier_selected           User picks a tier and advances past step 0.
//                                    Params: tier_name, tier_price, ref_source,
//                                            brand_variant
//   register_wallet_provided         User enters a valid HL trading wallet.
//                                    Params: wallet_method (manual|connected),
//                                            tier_name, ref_source, brand_variant
//   register_payment_method_selected User picks a payment method.
//                                    Params: payment_method (hyperliquid|wallet),
//                                            tier_name, ref_source, brand_variant
//   register_review_reached          User advances to the confirm step.
//                                    Params: tier_name, payment_method,
//                                            ref_source, brand_variant
//   register_payment_submitted       User clicks the "Pay XXX USDC" button.
//                                    Params: tier_name, tier_price,
//                                            payment_method, ref_source,
//                                            brand_variant
//
// `ref_source` defaults to 'direct' if no KOL referral is in sessionStorage.
// `brand_variant` is 'hyperscaled' on /register, 'vanta' on /vanta/register.
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

// Reads the KOL ref source set by <ReferralRedirect>. Returns 'direct' when
// no referral is stored (direct traffic or sessionStorage unavailable).
export function getRefSource() {
  if (typeof window === "undefined") return "direct";
  try {
    return window.sessionStorage.getItem("ref") || "direct";
  } catch {
    return "direct";
  }
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

// Fire a custom GA4 event. No-op when gtag hasn't loaded (SSR, ad blockers).
export function trackEvent(eventName, params = {}) {
  if (!gaAvailable()) return;
  window.gtag("event", eventName, params);
}

// Thin wrapper for CTA buttons. Auto-fills page_path from window.location so
// call sites only need to specify the label and where on the page it lives.
export function trackCtaClick({ label, location, destination = "/register" }) {
  trackEvent("cta_click", {
    cta_label: label,
    cta_location: location,
    cta_destination: destination,
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
  });
}
