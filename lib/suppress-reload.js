export async function withReloadSuppressed(fn) {
  if (typeof window === "undefined") return fn();

  const loc = window.location;
  const desc = safeGetOwnDescriptor(loc, "reload");
  if (!desc || desc.configurable === false) {
    return fn();
  }

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
  } catch {
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

function safeGetOwnDescriptor(obj, prop) {
  try {
    return Object.getOwnPropertyDescriptor(obj, prop) ?? null;
  } catch {
    return null;
  }
}
