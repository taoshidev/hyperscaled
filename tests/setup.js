// Global Vitest setup. Runs before every test file in the suite.

// Tests should never reach the network or external services. Force
// NODE_ENV=test (some libs branch on this) and disable Sentry/Slack
// transports so accidental fires do not pollute downstream systems.
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.SENTRY_DSN = process.env.SENTRY_DSN || "";
process.env.NEXT_PUBLIC_SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "";
process.env.SLACK_ERROR_WEBHOOK_URL = process.env.SLACK_ERROR_WEBHOOK_URL || "";
