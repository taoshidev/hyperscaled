"use client";

import { useEffect } from "react";

export function CoinbaseDisconnectGuard() {
  useEffect(() => {
    let cancelled = false;
    let installed = false;

    function tryDisable() {
      if (cancelled || installed) return installed;
      const ext = window.coinbaseWalletExtension;
      if (typeof ext?.disableReloadOnDisconnect === "function") {
        try {
          ext.disableReloadOnDisconnect();
          installed = true;
          console.info("[wallet] coinbase reload-on-disconnect disabled");
          return true;
        } catch {
          /* ignore */
        }
      }
      return false;
    }

    if (tryDisable()) return;

    const interval = setInterval(() => {
      if (tryDisable()) clearInterval(interval);
    }, 250);
    const timeout = setTimeout(() => clearInterval(interval), 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return null;
}
