/**
 * Central error reporting module.
 * Works on both client and server.
 *
 * Usage:
 *   import { reportError, reportCritical, reportWarning, SEVERITY } from "@/lib/errors"
 *
 *   reportError(err, { source: "api/dashboard", severity: SEVERITY.CRITICAL, userId: hlAddress })
 *   reportCritical(err, { source: "api/register", metadata: { status: 502 } })
 *   reportWarning("SSE disconnected", { source: "sse-stream" })
 */

import { sanitize } from "@/lib/errors-sanitize";

import * as Sentry from "@sentry/nextjs";

export const SEVERITY = {
  CRITICAL: "critical",
  ERROR: "error",
  WARNING: "warning",
};

/**
 * @param {Error|string} error
 * @param {{
 *   source?: string,
 *   severity?: "critical"|"error"|"warning",
 *   userId?: string,
 *   message?: string,
 *   metadata?: object
 * }} context
 */
export async function reportError(error, context = {}) {
  const severity = context.severity ?? SEVERITY.ERROR;
  const source = context.source ?? "unknown";
  const timestamp = new Date().toISOString();

  const safeError = sanitize(error);
  const safeContext = sanitize({ userId: context.userId, ...context.metadata });

  // 1. Always log locally
  const logFn = severity === SEVERITY.WARNING ? console.warn : console.error;
  logFn(`[${severity.toUpperCase()}][${source}]`, safeError, safeContext);

  const isProduction = process.env.NODE_ENV === "production";

  // 2. Sentry — production only
  if (isProduction) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error ?? "Unknown")), {
      level: severity,
      tags: { source },
      user: context.userId ? { id: sanitize(context.userId) } : undefined,
      extra: sanitize(context.metadata ?? {}),
    });
  }

  // 3. Slack — production, server-side only, critical and error severity
  if (isProduction && severity !== SEVERITY.WARNING && typeof window === "undefined") {
    import("@/lib/errors-slack")
      .then((mod) =>
        mod.sendSlackAlert({
          error,
          message: context.message,
          severity,
          source,
          timestamp,
          userId: context.userId,
          metadata: context.metadata,
        }),
      )
      .catch((e) => {
        console.error("[errors] Slack module failed to load", e);
        Sentry.captureException(e, { tags: { source: "errors/slack-import" } });
      });
  }
}

/**
 * Convenience wrapper for critical errors.
 */
export async function reportCritical(error, context = {}) {
  return reportError(error, { ...context, severity: SEVERITY.CRITICAL });
}

/**
 * Convenience wrapper for warnings.
 */
export function reportWarning(message, context = {}) {
  return reportError(
    message instanceof Error ? message : new Error(String(message)),
    { ...context, severity: SEVERITY.WARNING },
  );
}
