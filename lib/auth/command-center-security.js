/**
 * Shared env token for Command Center step-up after wallet SIWE (`COMMAND_CENTER_SECURITY_TOKEN`).
 * When unset, only wallet + staff checks apply.
 */

import crypto from "node:crypto";

export function commandCenterSecurityTokenConfigured() {
  const raw = process.env.COMMAND_CENTER_SECURITY_TOKEN;
  return typeof raw === "string" && raw.trim().length > 0;
}

function sha256utf8(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest();
}

/**
 * Constant-time compare of trimmed secrets using SHA-256 digests (fixed length).
 */
export function securityTokenMatches(candidate) {
  const expectedEnv = process.env.COMMAND_CENTER_SECURITY_TOKEN;
  if (typeof expectedEnv !== "string" || !expectedEnv.trim()) return false;
  const expected = expectedEnv.trim();
  const c = typeof candidate === "string" ? candidate.trim() : "";
  const a = sha256utf8(c);
  const b = sha256utf8(expected);
  return crypto.timingSafeEqual(a, b);
}
