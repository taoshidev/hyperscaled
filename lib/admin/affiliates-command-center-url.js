/**
 * URL helpers for /command-center/affiliates. Mirrors the shape used by
 * coupons-command-center-url so the toolbar / sortable column components
 * stay agnostic.
 */

const AFFILIATES_PATH = "/command-center/affiliates";

export const AFFILIATE_ADMIN_TABS = ["all", "active", "inactive", "tenant"];

export function parseAffiliateAdminTab(raw) {
  if (raw === "active" || raw === "inactive" || raw === "tenant") return raw;
  return "all";
}

export function affiliatesCommandCenterHref(opts) {
  const p = new URLSearchParams();
  if (opts.tab && opts.tab !== "all") p.set("tab", opts.tab);
  if (opts.page != null && opts.page > 1) p.set("page", String(opts.page));
  if (opts.q) p.set("q", opts.q);
  if (opts.sort && opts.sort.length > 0) {
    p.set("sort", opts.sort);
    p.set("dir", opts.dir ?? "asc");
  }
  const qs = p.toString();
  return qs ? `${AFFILIATES_PATH}?${qs}` : AFFILIATES_PATH;
}

export function affiliatesSortToggleHref(tab, q, page, activeSort, activeDir, column) {
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

  return affiliatesCommandCenterHref({
    tab,
    q,
    page: nextPage > 1 ? nextPage : undefined,
    sort: nextSort,
    dir: nextDir,
  });
}

export function affiliatesPageHref(tab, q, targetPage, activeSort, activeDir) {
  return affiliatesCommandCenterHref({
    tab,
    q,
    page: targetPage > 1 ? targetPage : undefined,
    sort: activeSort,
    dir: activeDir,
  });
}

export function affiliatesTabHref(nextTab, q, activeSort, activeDir) {
  return affiliatesCommandCenterHref({
    tab: nextTab,
    q,
    sort: activeSort,
    dir: activeDir,
  });
}
