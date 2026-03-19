// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "./lib/errors-sanitize.js";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 0.1,

  enableLogs: true,

  // Do not send PII — sanitize events before they leave the server
  sendDefaultPii: false,
  beforeSend: sanitizeSentryEvent,
});
