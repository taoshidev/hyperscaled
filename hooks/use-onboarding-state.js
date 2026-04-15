"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "hs_onboarding";
const CHANGE_EVENT = "hs-onboarding-change";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

const DEFAULT_STATE = {
  hlFunded: false,
  walletMatches: false,
  extensionInstalled: false,
  firstTradeAt: null,
  completedAt: null,
  dismissedAt: null,
  updatedAt: null,
};

function safeParse(json) {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function readState() {
  if (typeof window === "undefined") return DEFAULT_STATE;
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return { ...DEFAULT_STATE, ...(parsed || {}) };
}

function writeState(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function subscribe(callback) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e) => {
    if (!e || e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getServerSnapshot() {
  return DEFAULT_STATE;
}

// Cached snapshot so useSyncExternalStore gets a stable reference between
// renders when nothing has changed.
let cachedSnapshot = null;
let cachedRaw = null;

function getSnapshot() {
  if (typeof window === "undefined") return DEFAULT_STATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw && cachedSnapshot) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = { ...DEFAULT_STATE, ...(safeParse(raw) || {}) };
  return cachedSnapshot;
}

export function useOnboardingState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((patch) => {
    const current = readState();
    const next = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const allDone =
      next.hlFunded &&
      next.extensionInstalled &&
      next.firstTradeAt;
    if (allDone && !next.completedAt) {
      next.completedAt = new Date().toISOString();
    }
    writeState(next);
  }, []);

  const dismiss = useCallback(() => {
    update({ dismissedAt: new Date().toISOString() });
  }, [update]);

  const isSnoozed = Boolean(
    state.dismissedAt &&
      Date.now() - new Date(state.dismissedAt).getTime() < SNOOZE_MS,
  );

  return { state, update, dismiss, isSnoozed };
}
