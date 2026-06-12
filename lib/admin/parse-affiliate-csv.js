/**
 * Pure helpers for the bulk-affiliate-import CSV format.
 *
 * The expected file is a small CSV with two columns:
 *
 *   user_handle,affiliate_code
 *   brian_armstrong,BRIAN_ARMSTRONG
 *   polymarket,POLYMARKET
 *
 * Header names are case-insensitive. Common aliases (`handle`, `code`) are
 * also accepted so partner-supplied files don't have to be edited by hand.
 *
 * This module is dependency-free and runs in both the browser (client-side
 * parse + preview) and Node (server-action sanity checks + unit tests). No
 * CSV library exists in package.json, so we ship a small RFC-4180-ish parser
 * that handles quoted fields with embedded commas / newlines / `""` escapes.
 */

const HANDLE_HEADERS = new Set(["user_handle", "handle", "username", "user"]);
const CODE_HEADERS = new Set([
  "affiliate_code",
  "code",
  "promo_code",
  "coupon",
  "coupon_code",
]);

const MAX_SLUG_LENGTH = 64;
const MAX_CODE_LENGTH = 64;

/**
 * Normalize an external handle (e.g. `brian_armstrong`, `@LunarCrush`) into
 * a slug that satisfies the `affiliates.slug` regex
 * (`/^[a-z0-9][a-z0-9-]{1,63}$/`). Returns "" when the input cannot be
 * coerced to a valid slug.
 */
export function slugifyHandle(raw) {
  if (raw == null) return "";
  const lowered = String(raw).trim().toLowerCase();
  if (!lowered) return "";
  const replaced = lowered.replace(/[^a-z0-9]+/g, "-");
  const collapsed = replaced.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  if (collapsed.length < 2) return "";
  const truncated = collapsed.slice(0, MAX_SLUG_LENGTH);
  if (!/^[a-z0-9]/.test(truncated)) return "";
  return truncated;
}

/**
 * Normalize a coupon code. Coupons live in `coupons.code` which is a
 * varchar(255) and only requires `trim().toUpperCase()` to satisfy the
 * existing `normalizeCode` invariant. We additionally enforce a small
 * length cap for sanity and reject characters that have no business in a
 * shareable promo code.
 */
export function normalizeCouponCode(raw) {
  if (raw == null) return "";
  // Strip leading/trailing separators so partner codes like "_KATE_LV" or
  // "-promo-" still produce a valid code (must start with a letter/digit).
  const trimmed = String(raw)
    .trim()
    .toUpperCase()
    .replace(/^[_-]+/, "")
    .replace(/[_-]+$/, "");
  if (!trimmed) return "";
  if (trimmed.length > MAX_CODE_LENGTH) return "";
  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(trimmed)) return "";
  return trimmed;
}

/**
 * RFC-4180-ish CSV parser. Returns a 2D array of strings (one row per line,
 * trailing newline ignored). Supports:
 *   - quoted fields containing `,` / `\n` / `""`
 *   - bare fields
 *   - CRLF or LF line endings
 *
 * Throws on malformed input (unterminated quote) so we surface a clean
 * error to the operator instead of silently dropping rows.
 */
export function parseCsv(text) {
  if (text == null) return [];
  const src = String(text).replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
      if (ch === "\r" && src[i + 1] === "\n") {
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }

    cell += ch;
    i += 1;
  }

  if (inQuotes) {
    throw new Error("CSV parse failed: unterminated quoted field.");
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function pickHeaderIndex(headers, candidates) {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim().toLowerCase();
    if (candidates.has(h)) return i;
  }
  return -1;
}

/**
 * Build validated preview rows from already-parsed data rows, given the
 * explicit column indices the operator chose (or that were auto-detected).
 *
 * `dataRows` excludes the header row. `headerRowOffset` is the 1-based file
 * line of the first data row (defaults to 2: header is line 1).
 *
 * Each preview row keeps the raw handle/code as-typed so the operator can
 * see exactly what was in the file, plus the normalized slug and uppercased
 * code that will be inserted.
 *
 * @returns {Array<{
 *   index: number,            // 1-based file line (for keys / messages)
 *   rawHandle: string,
 *   rawCode: string,
 *   slug: string,             // normalized; "" when invalid
 *   code: string,             // normalized uppercase; "" when invalid
 *   error: string | null,     // first validation issue, if any
 * }>}
 */
export function buildImportRows(dataRows, handleIdx, codeIdx, headerRowOffset = 2) {
  if (
    !Array.isArray(dataRows) ||
    !Number.isInteger(handleIdx) ||
    !Number.isInteger(codeIdx) ||
    handleIdx < 0 ||
    codeIdx < 0 ||
    handleIdx === codeIdx
  ) {
    return [];
  }

  const seenSlugs = new Set();
  const seenCodes = new Set();
  const rows = [];

  for (let i = 0; i < dataRows.length; i++) {
    const raw = dataRows[i] ?? [];
    const rawHandle = String(raw[handleIdx] ?? "").trim();
    const rawCode = String(raw[codeIdx] ?? "").trim();

    if (!rawHandle && !rawCode) continue;

    const slug = slugifyHandle(rawHandle);
    const code = normalizeCouponCode(rawCode);

    let error = null;
    if (!rawHandle) {
      error = "Missing handle.";
    } else if (!slug) {
      error = `Could not derive a valid slug from "${rawHandle}".`;
    } else if (seenSlugs.has(slug)) {
      error = `Duplicate slug "${slug}" in CSV.`;
    } else if (!rawCode) {
      error = "Missing affiliate code.";
    } else if (!code) {
      error = `Invalid coupon code "${rawCode}" (letters/digits/_/- only, must start with letter or digit).`;
    } else if (seenCodes.has(code)) {
      error = `Duplicate code "${code}" in CSV.`;
    }

    if (slug && !seenSlugs.has(slug)) seenSlugs.add(slug);
    if (code && !seenCodes.has(code)) seenCodes.add(code);

    rows.push({
      index: i + headerRowOffset,
      rawHandle,
      rawCode,
      slug,
      code,
      error,
    });
  }

  return rows;
}

/**
 * Parse a CSV body for the bulk-affiliate-import flow.
 *
 * Header detection is best-effort: if a handle/code column can be matched by
 * name (`user_handle`/`handle`, `affiliate_code`/`code`), it is auto-selected
 * and `rows` is pre-built. When the columns can't be matched, parsing still
 * succeeds (`fileError` is null) and the caller is expected to let the
 * operator map columns manually using `headers` + `dataRows`, then rebuild
 * via `buildImportRows`.
 *
 * Returned shape:
 *   {
 *     headers: string[],            // header row, as-typed
 *     dataRows: string[][],         // every row after the header
 *     handleIdx: number,            // auto-detected handle col, or -1
 *     codeIdx: number,              // auto-detected code col, or -1
 *     autoDetected: boolean,        // both columns matched by name
 *     rows: PreviewRow[],           // pre-built when autoDetected, else []
 *     fileError: string | null,     // only for empty / malformed CSV
 *   }
 */
export function parseAffiliateImportCsv(text) {
  let table;
  try {
    table = parseCsv(text);
  } catch (e) {
    return {
      headers: [],
      dataRows: [],
      handleIdx: -1,
      codeIdx: -1,
      autoDetected: false,
      rows: [],
      fileError: e instanceof Error ? e.message : String(e),
    };
  }

  if (table.length === 0) {
    return {
      headers: [],
      dataRows: [],
      handleIdx: -1,
      codeIdx: -1,
      autoDetected: false,
      rows: [],
      fileError: "CSV is empty.",
    };
  }

  const headers = table[0].map((c) => String(c ?? ""));
  const dataRows = table.slice(1).map((r) => r.map((c) => String(c ?? "")));
  const handleIdx = pickHeaderIndex(headers, HANDLE_HEADERS);
  const codeIdx = pickHeaderIndex(headers, CODE_HEADERS);
  const autoDetected = handleIdx !== -1 && codeIdx !== -1;

  const rows = autoDetected ? buildImportRows(dataRows, handleIdx, codeIdx) : [];

  return {
    headers,
    dataRows,
    handleIdx,
    codeIdx,
    autoDetected,
    rows,
    fileError: null,
  };
}
