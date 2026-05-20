import { describe, it, expect } from "vitest";

import { csvEscape, defangCsvFormula, toCsv } from "@/lib/admin/csv.js";

describe("defangCsvFormula", () => {
  it("prefixes a single quote when the value starts with a formula trigger", () => {
    expect(defangCsvFormula("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
    expect(defangCsvFormula("+1+1")).toBe("'+1+1");
    expect(defangCsvFormula("-2+3")).toBe("'-2+3");
    expect(defangCsvFormula("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
    expect(defangCsvFormula("\tHIDDEN")).toBe("'\tHIDDEN");
    expect(defangCsvFormula("\rHIDDEN")).toBe("'\rHIDDEN");
  });

  it("leaves benign values untouched", () => {
    expect(defangCsvFormula("vanta")).toBe("vanta");
    expect(defangCsvFormula("user@example.com")).toBe("user@example.com");
    expect(defangCsvFormula("0x1234")).toBe("0x1234");
    expect(defangCsvFormula("")).toBe("");
    expect(defangCsvFormula(null)).toBe(null);
    expect(defangCsvFormula(undefined)).toBe(undefined);
  });
});

describe("csvEscape", () => {
  it("defangs and quotes when both apply", () => {
    expect(csvEscape('=cmd,"evil"')).toBe(`"'=cmd,""evil"""`);
  });

  it("does not double-quote benign cells", () => {
    expect(csvEscape("simple")).toBe("simple");
  });
});

describe("toCsv", () => {
  it("defangs every cell, including headers", () => {
    const out = toCsv(
      ["@col1", "name"],
      [
        ["=hostile", "alice"],
        ["benign", "+evil"],
      ],
    );

    const lines = out.split("\r\n");
    expect(lines[0]).toBe("'@col1,name");
    expect(lines[1]).toBe("'=hostile,alice");
    expect(lines[2]).toBe("benign,'+evil");
  });
});
