/**
 * Server-only Slack webhook poster.
 * Never import this directly on the client — it is loaded via dynamic import()
 * in errors.js only when typeof window === "undefined".
 */

import { sanitize } from "@/lib/errors-sanitize";

/**
 * @param {object} opts
 * @param {Error|string} opts.error
 * @param {string} [opts.message]  — overrides error.message in the Slack display; use for user-facing descriptions
 * @param {string} opts.severity
 * @param {string} opts.source
 * @param {string} opts.timestamp
 * @param {string} [opts.userId]   — will be masked by sanitize
 * @param {object} [opts.metadata]
 */
export async function sendSlackAlert({
  error,
  message,
  severity,
  source,
  timestamp,
  userId,
  metadata,
}) {
  try {
    const webhookUrl = process.env.SLACK_ERROR_WEBHOOK_URL;
    if (!webhookUrl) return;

    const rawMessage = message
      ?? (error instanceof Error ? error.message : String(error ?? "Unknown error"));

    const safeMessage = sanitize(rawMessage);
    const safeMetadata = metadata ? sanitize(metadata) : null;
    const safeUserId = userId ? sanitize(userId) : null;

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `:rotating_light: ${severity.toUpperCase()} — ${source}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Error:* ${safeMessage}`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Source:*\n${source}` },
          { type: "mrkdwn", text: `*Severity:*\n${severity}` },
          { type: "mrkdwn", text: `*Time:*\n${timestamp}` },
          ...(safeUserId
            ? [{ type: "mrkdwn", text: `*User:*\n${safeUserId}` }]
            : []),
        ],
      },
    ];

    if (safeMetadata && Object.keys(safeMetadata).length > 0) {
      const metaText = Object.entries(safeMetadata)
        .map(([k, v]) => `*${k}:* ${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join("\n");
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: metaText },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
  } catch {
    // Reporting failures must never surface to the caller
  }
}
