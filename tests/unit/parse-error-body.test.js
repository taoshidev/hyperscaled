import { describe, expect, it } from "vitest";
import { parseErrorBody } from "@/lib/parse-error-body.js";

describe("parseErrorBody", () => {
  it("returns null for null and undefined", () => {
    expect(parseErrorBody(null)).toBe(null);
    expect(parseErrorBody(undefined)).toBe(null);
  });

  it("returns null for empty / whitespace-only strings", () => {
    expect(parseErrorBody("")).toBe(null);
    expect(parseErrorBody("   \n  ")).toBe(null);
  });

  it("parses a JSON object body into a structured object", () => {
    const body = '{"status":"error","message":"Request to validator timed out"}\n';
    expect(parseErrorBody(body)).toEqual({
      status: "error",
      message: "Request to validator timed out",
    });
  });

  it("parses a JSON array body", () => {
    expect(parseErrorBody('[1,2,"three"]')).toEqual([1, 2, "three"]);
  });

  it("parses bare JSON primitives", () => {
    expect(parseErrorBody("42")).toBe(42);
    expect(parseErrorBody("true")).toBe(true);
    expect(parseErrorBody('"already registered to subaccount foo-uuid"')).toBe(
      "already registered to subaccount foo-uuid",
    );
  });

  it("returns the trimmed raw text when the body is not JSON", () => {
    expect(parseErrorBody("  Internal Server Error\n")).toBe("Internal Server Error");
  });

  it("trims surrounding whitespace before deciding JSON-ness", () => {
    expect(parseErrorBody('   {"a":1}   ')).toEqual({ a: 1 });
  });

  it("coerces non-string inputs (Buffer-like) into strings", () => {
    expect(parseErrorBody({ toString: () => '{"x":1}' })).toEqual({ x: 1 });
    expect(parseErrorBody({ toString: () => "" })).toBe(null);
  });
});
