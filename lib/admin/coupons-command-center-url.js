/**
 * URL helpers for /command-center/promo-codes. Port of
 * vanta-ui/lib/admin/coupons-command-center-url.ts adapted to the
 * hyperscaled route name.
 */

const PROMO_CODES_PATH = "/command-center/promo-codes";

export const COUPON_ADMIN_TABS = ["all", "percent", "fixed", "tier_restricted"];

export function parseCouponAdminTab(raw) {
  if (raw === "percent" || raw === "fixed" || raw === "tier_restricted") {
    return raw;
  }
  return "all";
}

export function couponsCommandCenterHref(opts) {
  const p = new URLSearchParams();
  if (opts.tab && opts.tab !== "all") p.set("tab", opts.tab);
  if (opts.page != null && opts.page > 1) p.set("page", String(opts.page));
  if (opts.sort && opts.sort.length > 0) {
    p.set("sort", opts.sort);
    p.set("dir", opts.dir ?? "asc");
  }
  const qs = p.toString();
  return qs ? `${PROMO_CODES_PATH}?${qs}` : PROMO_CODES_PATH;
}

export function couponsSortToggleHref(tab, page, activeSort, activeDir, column) {
  let nextSort;
  let nextDir;
  let nextPage = page;

  if (activeSort === column && activeDir === "asc") {
    nextSort = column;
    nextDir = "desc";
  } else if (activeSort === column && activeDir === "desc") {
    nextSort = undefined;
    nextDir = undefined;
    nextPage = 1;
  } else {
    nextSort = column;
    nextDir = "asc";
    nextPage = 1;
  }

  return couponsCommandCenterHref({
    tab,
    page: nextPage > 1 ? nextPage : undefined,
    sort: nextSort,
    dir: nextDir,
  });
}

export function couponsPageHref(tab, targetPage, activeSort, activeDir) {
  return couponsCommandCenterHref({
    tab,
    page: targetPage > 1 ? targetPage : undefined,
    sort: activeSort,
    dir: activeDir,
  });
}

export function couponsTabHref(nextTab, activeSort, activeDir) {
  return couponsCommandCenterHref({
    tab: nextTab,
    sort: activeSort,
    dir: activeDir,
  });
}
