const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

export function defangCsvFormula(value) {
  if (typeof value !== "string" || value.length === 0) return value;
  return FORMULA_TRIGGERS.test(value) ? `'${value}` : value;
}

export function csvEscape(value) {
  const safe = defangCsvFormula(value);
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function toCsv(headers, rows) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ];
  return lines.join("\r\n");
}
