"use server";

import {
  eq,
  and,
  or,
  isNotNull,
  inArray,
  desc,
  asc,
  count,
  ilike,
  sql,
} from "drizzle-orm";

import { getDb } from "@/lib/db/index.js";
import {
  affiliates,
  coupons,
  entityMiners,
  referralAttributions,
  registrationAttributions,
} from "@/lib/db/schema.js";
import { requireCommandCenterStaff } from "@/lib/auth/command-center.js";
import { parseAdminSort } from "@/lib/admin/command-center-sort.js";
import { slugifyHandle, normalizeCouponCode } from "@/lib/admin/parse-affiliate-csv.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const SORT_COLUMNS = [
  "slug",
  "name",
  "isActive",
  "useCount",
  "createdAt",
  "updatedAt",
];

const normalizeSlug = (slug) => String(slug ?? "").trim().toLowerCase();

function tabPredicate(tab) {
  switch (tab) {
    case "active":
      return eq(affiliates.isActive, true);
    case "inactive":
      return eq(affiliates.isActive, false);
    case "tenant":
      return isNotNull(affiliates.entityMinerHotkey);
    default:
      return undefined;
  }
}

export async function listAdminAffiliatesPage({
  tab = "all",
  q,
  page = 1,
  pageSize,
  sort,
  dir,
} = {}) {
  await requireCommandCenterStaff();
  const db = await getDb();

  const limit = Math.max(1, Math.min(pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE));
  const safePage = Math.max(1, page);

  const sortRes = parseAdminSort(sort, dir, SORT_COLUMNS, {
    column: "createdAt",
    dir: "desc",
  });

  const filters = [tabPredicate(tab)].filter(Boolean);
  if (q && q.trim().length > 0) {
    const like = `%${q.trim()}%`;
    filters.push(or(ilike(affiliates.slug, like), ilike(affiliates.name, like)));
  }
  const whereExpr = filters.length > 0 ? and(...filters) : undefined;

  const sortColumn = affiliates[sortRes.column] ?? affiliates.createdAt;
  const orderBy = sortRes.dir === "asc" ? asc(sortColumn) : desc(sortColumn);

  const baseQuery = db
    .select({
      id: affiliates.id,
      slug: affiliates.slug,
      name: affiliates.name,
      isActive: affiliates.isActive,
      useCount: affiliates.useCount,
      parentAffiliateId: affiliates.parentAffiliateId,
      entityMinerHotkey: affiliates.entityMinerHotkey,
      entityMinerSlug: entityMiners.slug,
      entityMinerName: entityMiners.name,
      promoCode: affiliates.promoCode,
      createdAt: affiliates.createdAt,
      updatedAt: affiliates.updatedAt,
    })
    .from(affiliates)
    .leftJoin(entityMiners, eq(affiliates.entityMinerHotkey, entityMiners.hotkey));

  const rowsP = whereExpr
    ? baseQuery.where(whereExpr).orderBy(orderBy).limit(limit).offset((safePage - 1) * limit)
    : baseQuery.orderBy(orderBy).limit(limit).offset((safePage - 1) * limit);

  const totalQ = db.select({ value: count() }).from(affiliates);
  const totalP = whereExpr ? totalQ.where(whereExpr) : totalQ;

  const [rows, totalRows] = await Promise.all([rowsP, totalP]);

  // Resolve parent affiliate slugs in one go for clean rendering.
  const parentIds = [
    ...new Set(rows.map((r) => r.parentAffiliateId).filter((v) => v != null)),
  ];
  const parentRows =
    parentIds.length === 0
      ? []
      : await db
          .select({ id: affiliates.id, slug: affiliates.slug, name: affiliates.name })
          .from(affiliates)
          .where(inArray(affiliates.id, parentIds));
  const parentBySlug = Object.fromEntries(parentRows.map((p) => [p.id, p]));

  return {
    rows: rows.map((r) => ({
      ...r,
      parent: r.parentAffiliateId ? parentBySlug[r.parentAffiliateId] ?? null : null,
    })),
    total: totalRows[0]?.value ?? 0,
    page: safePage,
    pageSize: limit,
    tab,
    q,
    sort: { activeSort: sortRes.activeSort, activeDir: sortRes.activeDir },
  };
}

/**
 * Flat list of affiliates (matching the given tab/search) for CSV/JSON export.
 * Returns the fields needed to reconstruct a share link, including the promo
 * code tied to each affiliate. Capped at `max` rows.
 */
export async function fetchAffiliatesForAdminCsvExport(tab = "all", q, max = 10000) {
  await requireCommandCenterStaff();
  const db = await getDb();

  const filters = [tabPredicate(tab)].filter(Boolean);
  if (q && q.trim().length > 0) {
    const like = `%${q.trim()}%`;
    filters.push(or(ilike(affiliates.slug, like), ilike(affiliates.name, like)));
  }
  const whereExpr = filters.length > 0 ? and(...filters) : undefined;
  const limit = Math.max(1, Math.min(max, 50000));

  const base = db
    .select({
      id: affiliates.id,
      slug: affiliates.slug,
      name: affiliates.name,
      isActive: affiliates.isActive,
      useCount: affiliates.useCount,
      parentAffiliateId: affiliates.parentAffiliateId,
      entityMinerSlug: entityMiners.slug,
      promoCode: affiliates.promoCode,
      createdAt: affiliates.createdAt,
    })
    .from(affiliates)
    .leftJoin(entityMiners, eq(affiliates.entityMinerHotkey, entityMiners.hotkey));

  const rows = whereExpr
    ? await base.where(whereExpr).orderBy(asc(affiliates.slug)).limit(limit)
    : await base.orderBy(asc(affiliates.slug)).limit(limit);

  const parentIds = [
    ...new Set(rows.map((r) => r.parentAffiliateId).filter((v) => v != null)),
  ];
  const parentRows =
    parentIds.length === 0
      ? []
      : await db
          .select({ id: affiliates.id, slug: affiliates.slug })
          .from(affiliates)
          .where(inArray(affiliates.id, parentIds));
  const parentById = Object.fromEntries(parentRows.map((p) => [p.id, p.slug]));

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    parentSlug: r.parentAffiliateId ? parentById[r.parentAffiliateId] ?? "" : "",
    tenantSlug: r.entityMinerSlug ?? "",
    promoCode: r.promoCode ?? "",
    clicks: r.useCount,
    status: r.isActive ? "active" : "inactive",
    createdAt: r.createdAt,
  }));
}

export async function getAffiliateById(id) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;

  const [row] = await db
    .select({
      id: affiliates.id,
      slug: affiliates.slug,
      name: affiliates.name,
      isActive: affiliates.isActive,
      useCount: affiliates.useCount,
      parentAffiliateId: affiliates.parentAffiliateId,
      entityMinerHotkey: affiliates.entityMinerHotkey,
      entityMinerSlug: entityMiners.slug,
      entityMinerName: entityMiners.name,
      promoCode: affiliates.promoCode,
      createdAt: affiliates.createdAt,
      updatedAt: affiliates.updatedAt,
    })
    .from(affiliates)
    .leftJoin(entityMiners, eq(affiliates.entityMinerHotkey, entityMiners.hotkey))
    .where(eq(affiliates.id, numericId))
    .limit(1);

  if (!row) return null;

  let parent = null;
  if (row.parentAffiliateId) {
    const [p] = await db
      .select({ id: affiliates.id, slug: affiliates.slug, name: affiliates.name })
      .from(affiliates)
      .where(eq(affiliates.id, row.parentAffiliateId))
      .limit(1);
    parent = p ?? null;
  }

  // Lightweight conversion summary for the detail surface.
  const [signupAgg] = await db
    .select({ value: count() })
    .from(referralAttributions)
    .where(eq(referralAttributions.affiliateId, row.id));
  const [convAgg] = await db
    .select({
      value: count(),
      total: sql`coalesce(sum(${registrationAttributions.amountUsdc}), 0)`,
    })
    .from(registrationAttributions)
    .where(eq(registrationAttributions.affiliateId, row.id));

  return {
    ...row,
    parent,
    stats: {
      signups: Number(signupAgg?.value ?? 0),
      conversions: Number(convAgg?.value ?? 0),
      revenueUsdc: Number(convAgg?.total ?? 0),
    },
  };
}

export async function listAffiliateMinerChoices() {
  await requireCommandCenterStaff();
  const db = await getDb();
  const rows = await db
    .select({
      hotkey: entityMiners.hotkey,
      slug: entityMiners.slug,
      name: entityMiners.name,
      isActive: entityMiners.isActive,
    })
    .from(entityMiners)
    .orderBy(asc(entityMiners.name));
  return rows.map((r) => ({
    value: r.hotkey,
    slug: r.slug,
    label: r.isActive ? r.name : `${r.name} (inactive)`,
  }));
}

export async function listAffiliateParentChoices(excludeId) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const rows = await db
    .select({
      id: affiliates.id,
      slug: affiliates.slug,
      name: affiliates.name,
    })
    .from(affiliates)
    .where(eq(affiliates.isActive, true))
    .orderBy(asc(affiliates.name));
  return rows
    .filter((r) => r.id !== excludeId)
    .map((r) => ({ value: String(r.id), label: `${r.name} (${r.slug})` }));
}

function validateAffiliateInput(input, { existingId } = {}) {
  const slug = normalizeSlug(input?.slug);
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(slug)) {
    return { ok: false, error: "Slug must be lowercase letters, numbers, or hyphens (2-64 chars)." };
  }
  const name = String(input?.name ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };

  const parentRaw = input?.parentAffiliateId;
  const parentAffiliateId =
    parentRaw == null || parentRaw === "" ? null : Number(parentRaw);
  if (parentAffiliateId != null && !Number.isFinite(parentAffiliateId)) {
    return { ok: false, error: "Invalid parent affiliate." };
  }
  if (
    existingId != null &&
    parentAffiliateId != null &&
    parentAffiliateId === existingId
  ) {
    return { ok: false, error: "An affiliate cannot be its own parent." };
  }

  const minerRaw = input?.entityMinerHotkey;
  const entityMinerHotkey =
    minerRaw == null || minerRaw === "" ? null : String(minerRaw);

  const promoRaw = input?.promoCode;
  const promoCode =
    promoRaw == null || String(promoRaw).trim() === ""
      ? null
      : String(promoRaw).trim().toUpperCase().slice(0, 255);

  return {
    ok: true,
    value: {
      slug,
      name,
      parentAffiliateId,
      entityMinerHotkey,
      promoCode,
      isActive: Boolean(input?.isActive ?? true),
    },
  };
}

export async function upsertAffiliate(input) {
  await requireCommandCenterStaff();
  const db = await getDb();

  const existingId = input?.id == null ? null : Number(input.id);
  const validated = validateAffiliateInput(input, { existingId });
  if (!validated.ok) return { success: false, error: validated.error };
  const v = validated.value;

  // Cycle guard for parent linkage: walk up the parent chain and reject if
  // we'd point at our own subtree.
  if (existingId != null && v.parentAffiliateId != null) {
    let cursor = v.parentAffiliateId;
    const seen = new Set();
    while (cursor != null && !seen.has(cursor)) {
      if (cursor === existingId) {
        return {
          success: false,
          error: "Selected parent would create a cycle.",
        };
      }
      seen.add(cursor);
      const [next] = await db
        .select({ id: affiliates.id, parentAffiliateId: affiliates.parentAffiliateId })
        .from(affiliates)
        .where(eq(affiliates.id, cursor))
        .limit(1);
      cursor = next?.parentAffiliateId ?? null;
    }
  }

  try {
    if (existingId != null) {
      const [row] = await db
        .update(affiliates)
        .set({
          slug: v.slug,
          name: v.name,
          parentAffiliateId: v.parentAffiliateId,
          entityMinerHotkey: v.entityMinerHotkey,
          promoCode: v.promoCode,
          isActive: v.isActive,
          updatedAt: new Date(),
        })
        .where(eq(affiliates.id, existingId))
        .returning({ id: affiliates.id });
      if (!row) return { success: false, error: "Affiliate not found." };
      return { success: true, id: row.id };
    }

    const [row] = await db
      .insert(affiliates)
      .values({
        slug: v.slug,
        name: v.name,
        parentAffiliateId: v.parentAffiliateId,
        entityMinerHotkey: v.entityMinerHotkey,
        promoCode: v.promoCode,
        isActive: v.isActive,
      })
      .returning({ id: affiliates.id });
    return { success: true, id: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("affiliates_slug_unique") || msg.includes("duplicate key")) {
      return { success: false, error: "Slug already in use." };
    }
    return { success: false, error: msg };
  }
}

export async function setAffiliateActive(id, isActive) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { success: false, error: "Invalid id." };
  }
  await db
    .update(affiliates)
    .set({ isActive: Boolean(isActive), updatedAt: new Date() })
    .where(eq(affiliates.id, numericId));
  return { success: true };
}

const MAX_BULK_IMPORT_ROWS = 1000;
const MAX_BULK_NOTES_LENGTH = 500;
const MAX_BATCH_LABEL_LENGTH = 120;

function normalizeBatchLabel(raw) {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  return t.length > MAX_BATCH_LABEL_LENGTH ? t.slice(0, MAX_BATCH_LABEL_LENGTH) : t;
}
const ALLOWED_USE_TYPES = new Set(["one_time", "multi_use", "unlimited"]);
const ALLOWED_DISCOUNT_TYPES = new Set(["percent", "fixed"]);
const ALLOWED_LINK_KINDS = new Set(["parent", "tenant", "none"]);
const ALLOWED_ON_DUPLICATE = new Set(["skip", "update_link"]);

function normalizePromoNotes(raw) {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  return t.length > MAX_BULK_NOTES_LENGTH
    ? t.slice(0, MAX_BULK_NOTES_LENGTH)
    : t;
}

function parseDateOrNull(raw) {
  if (raw == null || raw === "") return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

function validatePromoSpec(promo) {
  if (!promo || typeof promo !== "object") {
    return { ok: false, error: "Promo specs are required." };
  }
  const discountType = String(promo.discountType ?? "").toLowerCase();
  if (!ALLOWED_DISCOUNT_TYPES.has(discountType)) {
    return { ok: false, error: "Invalid discount type." };
  }
  const discountValueNum = Number(promo.discountValue);
  if (!Number.isFinite(discountValueNum) || discountValueNum <= 0) {
    return { ok: false, error: "Discount value must be a positive number." };
  }
  if (discountType === "percent" && discountValueNum > 100) {
    return { ok: false, error: "Percent discount cannot exceed 100." };
  }

  const useType = String(promo.useType ?? "unlimited");
  if (!ALLOWED_USE_TYPES.has(useType)) {
    return { ok: false, error: "Invalid use type." };
  }

  let maxUses = null;
  if (useType === "multi_use") {
    const raw = Number(promo.maxUses);
    if (!Number.isFinite(raw) || raw < 1) {
      return {
        ok: false,
        error: "Multi-use coupons require a max uses >= 1.",
      };
    }
    maxUses = Math.floor(raw);
  }

  const validFrom = parseDateOrNull(promo.validFrom);
  if (validFrom === undefined) {
    return { ok: false, error: "Invalid valid-from date." };
  }
  const validUntil = parseDateOrNull(promo.validUntil);
  if (validUntil === undefined) {
    return { ok: false, error: "Invalid valid-until date." };
  }
  if (validFrom && validUntil && validUntil < validFrom) {
    return {
      ok: false,
      error: "Valid-until must be on or after valid-from.",
    };
  }

  return {
    ok: true,
    value: {
      discountType,
      discountValue: String(discountValueNum),
      useType,
      maxUses,
      validFrom,
      validUntil,
      notes: normalizePromoNotes(promo.notes),
      batchLabel: normalizeBatchLabel(promo.batchLabel),
    },
  };
}

async function resolveCompanyLink(db, link) {
  const kind = String(link?.kind ?? "none");
  if (!ALLOWED_LINK_KINDS.has(kind)) {
    return { ok: false, error: "Invalid company link kind." };
  }
  if (kind === "none") {
    return { ok: true, value: { parentAffiliateId: null, entityMinerHotkey: null } };
  }
  if (kind === "parent") {
    const id = Number(link?.parentAffiliateId);
    if (!Number.isFinite(id)) {
      return { ok: false, error: "Invalid parent affiliate id." };
    }
    const [row] = await db
      .select({ id: affiliates.id })
      .from(affiliates)
      .where(eq(affiliates.id, id))
      .limit(1);
    if (!row) {
      return { ok: false, error: "Selected parent affiliate no longer exists." };
    }
    return {
      ok: true,
      value: { parentAffiliateId: row.id, entityMinerHotkey: null },
    };
  }
  // tenant
  const hotkey = String(link?.entityMinerHotkey ?? "");
  if (!hotkey) {
    return { ok: false, error: "Invalid tenant hotkey." };
  }
  const [row] = await db
    .select({ hotkey: entityMiners.hotkey })
    .from(entityMiners)
    .where(eq(entityMiners.hotkey, hotkey))
    .limit(1);
  if (!row) {
    return { ok: false, error: "Selected tenant no longer exists." };
  }
  return {
    ok: true,
    value: { parentAffiliateId: null, entityMinerHotkey: row.hotkey },
  };
}

/**
 * Bulk create affiliates + per-row promo coupons from a parsed CSV.
 *
 * Each row creates:
 *   1. one `affiliates` row (slug = `slugifyHandle(handle)`)
 *   2. one `coupons` row (code = uppercased CSV code)
 *
 * The two inserts for a single row run inside their own transaction so a
 * coupon-code collision doesn't leave a half-created affiliate behind, but
 * rows are otherwise independent: bad rows are reported and skipped, good
 * rows commit. The caller chunks rows so partial progress is visible.
 *
 * @param {{
 *   rows: Array<{ rawHandle: string, rawCode: string, slug?: string, code?: string }>,
 *   link: { kind: "parent"|"tenant"|"none", parentAffiliateId?: number, entityMinerHotkey?: string },
 *   promo: {
 *     discountType: "percent"|"fixed",
 *     discountValue: number|string,
 *     useType: "one_time"|"multi_use"|"unlimited",
 *     maxUses?: number|null,
 *     validFrom?: string|Date|null,
 *     validUntil?: string|Date|null,
 *     notes?: string|null,
 *   },
 *   onDuplicate?: "skip" | "update_link",
 * }} input
 */
export async function bulkImportAffiliates(input) {
  const staff = await requireCommandCenterStaff();
  const db = await getDb();

  if (!Array.isArray(input?.rows) || input.rows.length === 0) {
    return { success: false, error: "No rows provided." };
  }
  if (input.rows.length > MAX_BULK_IMPORT_ROWS) {
    return {
      success: false,
      error: `Too many rows in one call (max ${MAX_BULK_IMPORT_ROWS}). Chunk the CSV.`,
    };
  }

  const onDuplicate = ALLOWED_ON_DUPLICATE.has(input.onDuplicate)
    ? input.onDuplicate
    : "skip";

  const promoValidated = validatePromoSpec(input.promo);
  if (!promoValidated.ok) {
    return { success: false, error: promoValidated.error };
  }
  const promo = promoValidated.value;

  const linkResolved = await resolveCompanyLink(db, input.link);
  if (!linkResolved.ok) {
    return { success: false, error: linkResolved.error };
  }
  const link = linkResolved.value;

  const results = [];
  let created = 0;
  let skipped = 0;
  let errored = 0;

  for (const raw of input.rows) {
    const rawHandle = String(raw?.rawHandle ?? "").trim();
    const rawCode = String(raw?.rawCode ?? "").trim();
    // Re-derive the slug server-side rather than trusting the client value,
    // matching how `code` is re-normalized below. Falls back to the handle
    // when no slug was supplied (or it normalizes to empty).
    const slug = slugifyHandle(raw?.slug || rawHandle);
    const code = raw?.code ? normalizeCouponCode(raw.code) : normalizeCouponCode(rawCode);
    const displayName = rawHandle || slug;

    const pushResult = (status, extra) => {
      results.push({ rawHandle, rawCode, slug, code, status, ...extra });
    };

    if (!slug) {
      errored++;
      pushResult("error", {
        error: `Could not derive a valid slug from "${rawHandle}".`,
      });
      continue;
    }
    if (!code) {
      errored++;
      pushResult("error", {
        error: `Invalid coupon code "${rawCode}".`,
      });
      continue;
    }

    try {
      const outcome = await db.transaction(async (tx) => {
        // 1. Affiliate row (insert-or-skip / insert-or-update-link)
        const [existingAff] = await tx
          .select({
            id: affiliates.id,
            parentAffiliateId: affiliates.parentAffiliateId,
            entityMinerHotkey: affiliates.entityMinerHotkey,
          })
          .from(affiliates)
          .where(eq(affiliates.slug, slug))
          .limit(1);

        let affiliateId;
        let affiliateAction;
        if (existingAff) {
          affiliateId = existingAff.id;
          if (onDuplicate === "update_link" && input.link?.kind !== "none") {
            await tx
              .update(affiliates)
              .set({
                parentAffiliateId: link.parentAffiliateId,
                entityMinerHotkey: link.entityMinerHotkey,
                promoCode: code,
                updatedAt: new Date(),
              })
              .where(eq(affiliates.id, existingAff.id));
            affiliateAction = "affiliate_link_updated";
          } else {
            affiliateAction = "affiliate_existed";
          }
        } else {
          const [inserted] = await tx
            .insert(affiliates)
            .values({
              slug,
              name: displayName,
              isActive: true,
              parentAffiliateId: link.parentAffiliateId,
              entityMinerHotkey: link.entityMinerHotkey,
              promoCode: code,
            })
            .returning({ id: affiliates.id });
          affiliateId = inserted?.id ?? null;
          affiliateAction = "affiliate_created";
        }

        // 2. Coupon row. Coupon codes are tenant-agnostic; we never mutate
        //    an existing code, so a collision is reported as a skip.
        const [existingCoupon] = await tx
          .select({ id: coupons.id })
          .from(coupons)
          .where(eq(coupons.code, code))
          .limit(1);

        let couponId;
        let couponAction;
        if (existingCoupon) {
          couponId = existingCoupon.id;
          couponAction = "coupon_existed";
        } else {
          const [inserted] = await tx
            .insert(coupons)
            .values({
              code,
              discountType: promo.discountType,
              discountValue: promo.discountValue,
              useType: promo.useType,
              maxUses: promo.maxUses,
              allowedEmails: null,
              allowedTierIds: null,
              validFrom: promo.validFrom ?? null,
              validUntil: promo.validUntil ?? null,
              createdByWallet: staff.wallet,
              notes: promo.notes,
              batchLabel: promo.batchLabel,
            })
            .returning({ id: coupons.id });
          couponId = inserted?.id ?? null;
          couponAction = "coupon_created";
        }

        return { affiliateId, affiliateAction, couponId, couponAction };
      });

      const fullyCreated =
        outcome.affiliateAction === "affiliate_created" &&
        outcome.couponAction === "coupon_created";
      if (fullyCreated) {
        created++;
        pushResult("created", {
          affiliateId: outcome.affiliateId,
          couponId: outcome.couponId,
          affiliateAction: outcome.affiliateAction,
          couponAction: outcome.couponAction,
        });
      } else {
        skipped++;
        pushResult("skipped", {
          affiliateId: outcome.affiliateId,
          couponId: outcome.couponId,
          affiliateAction: outcome.affiliateAction,
          couponAction: outcome.couponAction,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errored++;
      pushResult("error", { error: msg });
    }
  }

  return {
    success: true,
    requested: input.rows.length,
    created,
    skipped,
    errored,
    results,
  };
}
