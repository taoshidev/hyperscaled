import { useSyncExternalStore } from "react";

// Shared state for the sunset banner (Notion #1560). The banner lives in the
// root layout, outside the wagmi <Providers>, so the dashboard publishes
// "a wallet is connected here" through this store instead of context.
//
// Dismissal is per browser session and only honored where the banner is
// dismissible (the wallet-connected dashboard); everywhere else it always
// shows.

const DISMISSED_KEY = "hs_sunset_banner_dismissed";

let dismissible = false;
// Fallback when sessionStorage throws (private mode / blocked storage): the
// dismissal still holds for the life of the page.
let dismissedInMemory = false;
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readDismissed() {
  if (dismissedInMemory) return true;
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSunsetBannerDismissible(value) {
  const next = Boolean(value);
  if (next === dismissible) return;
  dismissible = next;
  emit();
}

export function dismissSunsetBanner() {
  dismissedInMemory = true;
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    /* private browsing / quota — in-memory flag covers this page */
  }
  emit();
}

export function useSunsetBannerDismissible() {
  return useSyncExternalStore(subscribe, () => dismissible, () => false);
}

export function useSunsetBannerDismissed() {
  return useSyncExternalStore(subscribe, readDismissed, () => false);
}

// Current banner height in px, for JS offsets that can't use the CSS variable
// (e.g. IntersectionObserver rootMargin). 0 on the server or when hidden.
export function siteBannerHeight() {
  if (typeof document === "undefined") return 0;
  const value = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--site-banner-h"),
  );
  return Number.isFinite(value) ? value : 0;
}
