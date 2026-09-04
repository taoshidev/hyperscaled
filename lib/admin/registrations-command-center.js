/**
 * Command Center → Registrations page: URL/state helpers that are safe to
 * import from server pages, server actions and client components alike.
 * (Kept out of `app/actions/registrations.js` because a "use server" module
 * may only export async functions.)
 */

export const REGISTRATIONS_ADMIN_PAGE_SIZE = 50;

/** Tab id → registration statuses it shows. */
export const REGISTRATIONS_ADMIN_STATUS_FILTERS = {
  attention: ["pending", "failed"],
  pending: ["pending"],
  failed: ["failed"],
};

export function parseRegistrationsAdminStatus(raw) {
  return typeof raw === "string" && Object.hasOwn(REGISTRATIONS_ADMIN_STATUS_FILTERS, raw)
    ? raw
    : "attention";
}

export function registrationsAdminHref(status = "attention", page = 1) {
  const sp = new URLSearchParams();
  if (status !== "attention") sp.set("status", status);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/command-center/registrations${qs ? `?${qs}` : ""}`;
}
