"use server";

import {
  eq,
  and,
  or,
  isNotNull,
  desc,
  asc,
  count,
  ilike,
  sql,
} from "drizzle-orm";

import { getDb } from "@/lib/db/index.js";
import {
  affiliates,
  entityMiners,
  referralAttributions,
  registrationAttributions,
} from "@/lib/db/schema.js";
import { requireCommandCenterStaff } from "@/lib/auth/command-center.js";
import { parseAdminSort } from "@/lib/admin/command-center-sort.js";

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
          .where(sql`${affiliates.id} = ANY(${sql.raw(`ARRAY[${parentIds.join(",")}]::int[]`)})`);
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

  return {
    ok: true,
    value: {
      slug,
      name,
      parentAffiliateId,
      entityMinerHotkey,
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
