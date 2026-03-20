import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: init } = await import("./instrumentation.node.js");
    init();
  }
}

export const onRequestError = Sentry.captureRequestError;
