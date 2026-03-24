"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { sanitize } from "@/lib/errors-sanitize";

// Catches crashes in the root layout — must include its own <html> and <body>
// since the layout is unavailable when this renders.
export default function GlobalError({ error, reset }) {
  // In development, let Next.js's built-in error overlay handle errors
  if (process.env.NODE_ENV === "development") {
    throw error;
  }

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0d0d0d", color: "#fafafa", fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1rem" }}>
          <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: "0.5rem" }}>
              Critical Error
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#888", marginBottom: "1.5rem" }}>
              An unexpected error occurred. The team has been notified.
            </p>

            {error?.message && (
              <div style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1.5rem", textAlign: "left" }}>
                <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#888", wordBreak: "break-word", margin: 0 }}>
                  {sanitize(error.message)}
                </p>
              </div>
            )}

            <button
              onClick={reset}
              style={{ height: "2.75rem", padding: "0 1.5rem", borderRadius: "0.5rem", background: "#00C6A7", color: "#000", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
