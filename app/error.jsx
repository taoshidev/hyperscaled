"use client";

import { useEffect } from "react";
import { reportError, SEVERITY } from "@/lib/errors";
import { sanitize } from "@/lib/errors-sanitize";

export default function ErrorBoundary({ error, reset }) {
  // In development, let Next.js's built-in error overlay handle errors
  if (process.env.NODE_ENV === "development") {
    throw error;
  }

  useEffect(() => {
    reportError(error, {
      source: "error-boundary",
      severity: SEVERITY.CRITICAL,
    });
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Unhandled Error
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. The team has been notified.
          </p>
        </div>

        {error?.message && (
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-left">
            <p className="text-xs font-mono text-muted-foreground break-words">
              {sanitize(error.message)}
            </p>
          </div>
        )}

        <button
          onClick={reset}
          className="h-11 px-6 rounded-lg bg-teal-500 text-black text-sm font-semibold transition-[opacity] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
