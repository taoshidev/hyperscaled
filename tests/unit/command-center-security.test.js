import { afterEach, describe, expect, it } from "vitest";

import {
  commandCenterSecurityTokenConfigured,
  securityTokenMatches,
} from "@/lib/auth/command-center-security.js";

const KEY = "COMMAND_CENTER_SECURITY_TOKEN";

describe("command center security token", () => {
  const previous = process.env[KEY];

  afterEach(() => {
    process.env[KEY] = previous;
  });

  it("configured only when trimmed token is non-empty", () => {
    process.env[KEY] = "";
    expect(commandCenterSecurityTokenConfigured()).toBe(false);
    process.env[KEY] = "   ";
    expect(commandCenterSecurityTokenConfigured()).toBe(false);
    process.env[KEY] = "x";
    expect(commandCenterSecurityTokenConfigured()).toBe(true);
  });

  it("matches exact trimmed secret via digest compare", () => {
    process.env[KEY] = "  abc  ";
    expect(securityTokenMatches("abc")).toBe(true);
    expect(securityTokenMatches(" abc ")).toBe(true);
    expect(securityTokenMatches("ab")).toBe(false);
  });
});
