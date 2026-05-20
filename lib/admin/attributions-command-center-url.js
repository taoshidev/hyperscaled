/**
 * URL helpers for /command-center/attributions. Filters live in the query
 * string so the page can be linked / bookmarked / shared.
 */

const ATTRIBUTIONS_PATH = "/command-center/attributions";

export function parseAttributionFilters(sp) {
  const get = (k) =>
    typeof sp?.[k] === "string" && sp[k].length > 0 ? sp[k] : undefined;
  const from = get("from");
  const to = get("to");
  const affiliate = get("affiliate");
  const tenant = get("tenant");
  const promo = get("promo");
  const page = Math.max(1, parseInt(sp?.page ?? "1", 10) || 1);

  return { from, to, affiliate, tenant, promo, page };
}

export function attributionsHref(filters) {
  const p = new URLSearchParams();
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.affiliate) p.set("affiliate", filters.affiliate);
  if (filters.tenant) p.set("tenant", filters.tenant);
  if (filters.promo) p.set("promo", filters.promo);
  if (filters.page && filters.page > 1) p.set("page", String(filters.page));
  const qs = p.toString();
  return qs ? `${ATTRIBUTIONS_PATH}?${qs}` : ATTRIBUTIONS_PATH;
}

export function attributionsExportHref(filters, format) {
  const p = new URLSearchParams();
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.affiliate) p.set("affiliate", filters.affiliate);
  if (filters.tenant) p.set("tenant", filters.tenant);
  if (filters.promo) p.set("promo", filters.promo);
  if (format === "json") p.set("format", "json");
  const qs = p.toString();
  return `/api/command-center/export/attributions${qs ? `?${qs}` : ""}`;
}
