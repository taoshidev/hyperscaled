import { describe, it, expect } from "vitest";

import {
  slugifyHandle,
  normalizeCouponCode,
  parseCsv,
  buildImportRows,
  parseAffiliateImportCsv,
} from "@/lib/admin/parse-affiliate-csv.js";

describe("slugifyHandle", () => {
  it("lowercases and replaces non-alphanumerics with hyphens", () => {
    expect(slugifyHandle("Brian_Armstrong")).toBe("brian-armstrong");
    expect(slugifyHandle("kinetiq_xyz")).toBe("kinetiq-xyz");
    expect(slugifyHandle("@LunarCrush")).toBe("lunarcrush");
    expect(slugifyHandle("the rollup co")).toBe("the-rollup-co");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(slugifyHandle("__weird__name__")).toBe("weird-name");
    expect(slugifyHandle("a---b")).toBe("a-b");
    expect(slugifyHandle("--hello--")).toBe("hello");
  });

  it("returns empty for inputs that cannot be coerced", () => {
    expect(slugifyHandle("")).toBe("");
    expect(slugifyHandle(null)).toBe("");
    expect(slugifyHandle(undefined)).toBe("");
    expect(slugifyHandle("a")).toBe("");
    expect(slugifyHandle("___")).toBe("");
    expect(slugifyHandle("   ")).toBe("");
  });

  it("truncates to 64 characters", () => {
    const long = "x".repeat(80);
    expect(slugifyHandle(long)).toHaveLength(64);
  });
});

describe("normalizeCouponCode", () => {
  it("uppercases, trims, and accepts letters/digits/_/-", () => {
    expect(normalizeCouponCode("brian_armstrong")).toBe("BRIAN_ARMSTRONG");
    expect(normalizeCouponCode("  hello-world  ")).toBe("HELLO-WORLD");
    expect(normalizeCouponCode("SUMMER25")).toBe("SUMMER25");
  });

  it("strips leading/trailing separators so partner codes still validate", () => {
    expect(normalizeCouponCode("_KATE_LV")).toBe("KATE_LV");
    expect(normalizeCouponCode("__kate__")).toBe("KATE");
    expect(normalizeCouponCode("-promo-")).toBe("PROMO");
    expect(normalizeCouponCode("_7vomercy")).toBe("7VOMERCY");
  });

  it("rejects empty, separator-only, and disallowed-character codes", () => {
    expect(normalizeCouponCode("")).toBe("");
    expect(normalizeCouponCode(null)).toBe("");
    expect(normalizeCouponCode("___")).toBe("");
    expect(normalizeCouponCode("HAS SPACE")).toBe("");
    expect(normalizeCouponCode("WITH$DOLLAR")).toBe("");
  });
});

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    const csv = "a,b,c\n1,2,3\n4,5,6";
    expect(parseCsv(csv)).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  it("handles quoted fields with commas, newlines, and escaped quotes", () => {
    const csv =
      'name,bio\r\n' +
      '"Doe, Jane","She said ""hi"""\r\n' +
      '"multi\nline","ok"\r\n';
    expect(parseCsv(csv)).toEqual([
      ["name", "bio"],
      ["Doe, Jane", 'She said "hi"'],
      ["multi\nline", "ok"],
    ]);
  });

  it("strips the UTF-8 BOM and skips blank lines", () => {
    const csv = "\uFEFFhandle,code\n\nfoo,FOO\n";
    expect(parseCsv(csv)).toEqual([
      ["handle", "code"],
      ["foo", "FOO"],
    ]);
  });

  it("throws on an unterminated quoted field", () => {
    expect(() => parseCsv('a,"unterminated\n')).toThrow(/unterminated/i);
  });
});

describe("buildImportRows (manual column mapping)", () => {
  it("builds validated rows from arbitrary column indices", () => {
    const dataRows = [
      ["x", "brian_armstrong", "BRIAN"],
      ["y", "polymarket", "POLYMARKET"],
    ];
    const rows = buildImportRows(dataRows, 1, 2);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      rawHandle: "brian_armstrong",
      slug: "brian-armstrong",
      code: "BRIAN",
      error: null,
    });
    expect(rows[1]).toMatchObject({ slug: "polymarket", code: "POLYMARKET" });
  });

  it("returns empty when indices are missing, negative, or identical", () => {
    const dataRows = [["foo", "FOO"]];
    expect(buildImportRows(dataRows, -1, 1)).toEqual([]);
    expect(buildImportRows(dataRows, 0, -1)).toEqual([]);
    expect(buildImportRows(dataRows, 1, 1)).toEqual([]);
    expect(buildImportRows(null, 0, 1)).toEqual([]);
  });

  it("uses the header-row offset for the reported file line", () => {
    const dataRows = [["foo", "FOO"]];
    const rows = buildImportRows(dataRows, 0, 1);
    expect(rows[0].index).toBe(2);
  });
});

describe("parseAffiliateImportCsv", () => {
  it("maps header aliases and validates rows", () => {
    const csv =
      "user_handle,affiliate_code\n" +
      "brian_armstrong,BRIAN_ARMSTRONG\n" +
      "polymarket,POLYMARKET\n";
    const result = parseAffiliateImportCsv(csv);
    expect(result.fileError).toBeNull();
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      rawHandle: "brian_armstrong",
      slug: "brian-armstrong",
      code: "BRIAN_ARMSTRONG",
      error: null,
    });
    expect(result.rows[1]).toMatchObject({
      slug: "polymarket",
      code: "POLYMARKET",
      error: null,
    });
  });

  it("accepts shorter aliases (handle/code)", () => {
    const csv = "handle,code\nfoo,FOO\n";
    const result = parseAffiliateImportCsv(csv);
    expect(result.fileError).toBeNull();
    expect(result.rows[0].slug).toBe("foo");
    expect(result.rows[0].code).toBe("FOO");
  });

  it("does not hard-fail on unrecognized headers; exposes columns for manual mapping", () => {
    const csv = "name,promo\nbrian_armstrong,BRIAN\nfoo,FOO\n";
    const result = parseAffiliateImportCsv(csv);
    expect(result.fileError).toBeNull();
    expect(result.autoDetected).toBe(false);
    expect(result.handleIdx).toBe(-1);
    expect(result.codeIdx).toBe(-1);
    expect(result.headers).toEqual(["name", "promo"]);
    expect(result.dataRows).toEqual([
      ["brian_armstrong", "BRIAN"],
      ["foo", "FOO"],
    ]);
    // No columns chosen yet -> no pre-built rows.
    expect(result.rows).toHaveLength(0);
  });

  it("reports auto-detected column indices when headers match", () => {
    const csv = "extra,user_handle,affiliate_code\nx,foo,FOO\n";
    const result = parseAffiliateImportCsv(csv);
    expect(result.autoDetected).toBe(true);
    expect(result.handleIdx).toBe(1);
    expect(result.codeIdx).toBe(2);
    expect(result.rows[0]).toMatchObject({ slug: "foo", code: "FOO" });
  });

  it("flags duplicate slugs and duplicate codes inside the file", () => {
    const csv =
      "user_handle,affiliate_code\n" +
      "Brian_Armstrong,BRIAN\n" +
      "brian-armstrong,SECOND\n" +
      "other,BRIAN\n";
    const result = parseAffiliateImportCsv(csv);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].error).toBeNull();
    expect(result.rows[1].error).toMatch(/Duplicate slug/);
    expect(result.rows[2].error).toMatch(/Duplicate code/);
  });

  it("flags missing or unparseable values per row", () => {
    const csv =
      "user_handle,affiliate_code\n" +
      ",MISSING_HANDLE\n" +
      "ok_handle,\n" +
      "valid_handle,VALID\n";
    const result = parseAffiliateImportCsv(csv);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].error).toMatch(/Missing handle/);
    expect(result.rows[1].error).toMatch(/Missing affiliate code/);
    expect(result.rows[2].error).toBeNull();
  });

  it("accepts quoted fields with commas in the display handle", () => {
    const csv =
      'user_handle,affiliate_code\n' +
      '"Doe, Jane",JDOE\n';
    const result = parseAffiliateImportCsv(csv);
    expect(result.rows[0].rawHandle).toBe("Doe, Jane");
    expect(result.rows[0].slug).toBe("doe-jane");
    expect(result.rows[0].code).toBe("JDOE");
  });

  it("returns an empty result with fileError when the CSV is empty", () => {
    expect(parseAffiliateImportCsv("")).toEqual({
      headers: [],
      dataRows: [],
      handleIdx: -1,
      codeIdx: -1,
      autoDetected: false,
      rows: [],
      fileError: "CSV is empty.",
    });
  });
});
