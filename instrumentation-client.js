import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "@/lib/errors-sanitize";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Low sample rate — adjust when traffic warrants it
  tracesSampleRate: 0.1,

  // No session replay — privacy concern
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  beforeSend: sanitizeSentryEvent,

  // Filter browser noise that isn't actionable
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Browser extension interference
    "Cannot redefine property: ethereum",
    "Non-Error promise rejection captured",
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
