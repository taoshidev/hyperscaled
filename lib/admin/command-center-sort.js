/**
 * Shared sort URL helpers for command-center list pages. Mirrors the
 * vanta-ui implementation so columns, default fallbacks, and three-state
 * toggling (asc → desc → unset) behave identically.
 *
 * @typedef {"asc" | "desc"} AdminSortDir
 */

export function adminListQueryString(parts) {
  const p = new URLSearchParams();
  if (parts.q && parts.q.length > 0) p.set("q", parts.q);
  if (parts.page != null && parts.page > 1) p.set("page", String(parts.page));
  if (parts.sort) {
    p.set("sort", parts.sort);
    p.set("dir", parts.dir ?? "asc");
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function parseAdminSort(rawSort, rawDir, allowed, defaultWhenUnset) {
  if (rawSort && allowed.includes(rawSort)) {
    const dir = rawDir === "desc" ? "desc" : "asc";
    return { column: rawSort, dir, activeSort: rawSort, activeDir: dir };
  }
  return {
    column: defaultWhenUnset.column,
    dir: defaultWhenUnset.dir,
    activeSort: undefined,
    activeDir: undefined,
  };
}
