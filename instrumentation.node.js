import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "./lib/errors-sanitize.js";

export default function init() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    beforeSend: sanitizeSentryEvent,
  });
}
