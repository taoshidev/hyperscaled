export async function withReloadSuppressed(fn) {
  if (typeof window === "undefined") return fn();

  const loc = window.location;
  let originalReload;
  let restored = false;
  let blocked = 0;

  try {
    originalReload = loc.reload;
    Object.defineProperty(loc, "reload", {
      configurable: true,
      writable: true,
      value: () => {
        blocked += 1;
        console.warn(
          "[wallet] suppressed window.location.reload() during wallet swap",
        );
      },
    });
  } catch (err) {
    console.warn("[wallet] could not patch reload — proceeding anyway", err);
    return fn();
  }

  function restore() {
    if (restored || !originalReload) return;
    restored = true;
    try {
      Object.defineProperty(loc, "reload", {
        configurable: true,
        writable: true,
        value: originalReload,
      });
    } catch {
      /* ignore */
    }
  }

  try {
    const result = await fn();
    return result;
  } finally {
    setTimeout(() => {
      restore();
      if (blocked > 0) {
        console.info(
          `[wallet] reload suppressor unwound (${blocked} blocked)`,
        );
      }
    }, 500);
  }
}
