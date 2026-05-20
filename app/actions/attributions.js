"use server";

import {
  eq,
  and,
  gte,
  lte,
  desc,
  count,
  sql,
} from "drizzle-orm";

import { getDb } from "@/lib/db/index.js";
import {
  affiliates,
  entityMiners,
  referralAttributions,
  referralClicks,
  registrationAttributions,
  registrations,
  users,
} from "@/lib/db/schema.js";
import { requireCommandCenterStaff } from "@/lib/auth/command-center.js";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const MAX_EXPORT_ROWS = 50_000;

function parseDateBoundary(raw, endOfDay = false) {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) {
    // For "to" we want inclusive end-of-day if no time was supplied. Detect
    // bare YYYY-MM-DD by length and bump to 23:59:59.999 in that case.
    if (typeof raw === "string" && raw.length === 10) {
      d.setHours(23, 59, 59, 999);
    }
  }
  return d;
}

async function resolveAffiliateId(db, slug) {
  if (!slug) return null;
  const [row] = await db
    .select({ id: affiliates.id })
    .from(affiliates)
    .where(eq(affiliates.slug, slug.toLowerCase()))
    .limit(1);
  return row?.id ?? null;
}

async function resolveEntityMinerHotkey(db, slug) {
  if (!slug) return null;
  const [row] = await db
    .select({ hotkey: entityMiners.hotkey })
    .from(entityMiners)
    .where(eq(entityMiners.slug, slug.toLowerCase()))
    .limit(1);
  return row?.hotkey ?? null;
}

function clickFilters({ from, to, affiliateId, minerHotkey, promo }) {
  const f = [];
  if (from) f.push(gte(referralClicks.occurredAt, from));
  if (to) f.push(lte(referralClicks.occurredAt, to));
  if (affiliateId != null) f.push(eq(referralClicks.affiliateId, affiliateId));
  if (minerHotkey) f.push(eq(referralClicks.entityMinerHotkey, minerHotkey));
  if (promo) f.push(eq(referralClicks.promoCode, promo.toUpperCase()));
  return f;
}

function attrFilters({ from, to, affiliateId, minerHotkey, promo }) {
  const f = [];
  if (from) f.push(gte(referralAttributions.signupAt, from));
  if (to) f.push(lte(referralAttributions.signupAt, to));
  if (affiliateId != null) f.push(eq(referralAttributions.affiliateId, affiliateId));
  if (minerHotkey) f.push(eq(referralAttributions.entityMinerHotkey, minerHotkey));
  if (promo) f.push(eq(referralAttributions.promoCode, promo.toUpperCase()));
  return f;
}

function regFilters({ from, to, affiliateId, minerHotkey, promo }) {
  const f = [];
  if (from) f.push(gte(registrationAttributions.registeredAt, from));
  if (to) f.push(lte(registrationAttributions.registeredAt, to));
  if (affiliateId != null) f.push(eq(registrationAttributions.affiliateId, affiliateId));
  if (minerHotkey) f.push(eq(registrationAttributions.entityMinerHotkey, minerHotkey));
  if (promo) f.push(eq(registrationAttributions.promoCode, promo.toUpperCase()));
  return f;
}

async function resolveFilters(db, raw) {
  return {
    from: parseDateBoundary(raw.from, false),
    to: parseDateBoundary(raw.to, true),
    affiliateId: await resolveAffiliateId(db, raw.affiliate),
    minerHotkey: await resolveEntityMinerHotkey(db, raw.tenant),
    promo: raw.promo,
  };
}

export async function getAttributionStats(filters = {}) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const f = await resolveFilters(db, filters);

  const cFs = clickFilters(f);
  const aFs = attrFilters(f);
  const rFs = regFilters(f);

  const [clicks] = await db
    .select({ value: count() })
    .from(referralClicks)
    .where(cFs.length > 0 ? and(...cFs) : undefined);
  const [signups] = await db
    .select({ value: count() })
    .from(referralAttributions)
    .where(aFs.length > 0 ? and(...aFs) : undefined);
  const [conversions] = await db
    .select({
      value: count(),
      total: sql`coalesce(sum(${registrationAttributions.amountUsdc}), 0)`,
    })
    .from(registrationAttributions)
    .where(rFs.length > 0 ? and(...rFs) : undefined);

  return {
    clicks: Number(clicks?.value ?? 0),
    signups: Number(signups?.value ?? 0),
    conversions: Number(conversions?.value ?? 0),
    revenueUsdc: Number(conversions?.total ?? 0),
  };
}

/**
 * Returns one row per paid registration_attribution joined with miner /
 * affiliate / user wallet so the table can render without follow-up
 * queries. This is the "conversion ledger" view; clicks and signups are
 * shown only as aggregate stats (drilling into clicks would scale poorly).
 */
export async function listAdminAttributionsPage(rawFilters = {}) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const f = await resolveFilters(db, rawFilters);

  const limit = DEFAULT_PAGE_SIZE;
  const safePage = Math.max(1, rawFilters.page ?? 1);
  const offset = (safePage - 1) * limit;

  const filters = regFilters(f);
  const where = filters.length > 0 ? and(...filters) : undefined;

  const rowsP = db
    .select({
      id: registrationAttributions.id,
      registrationId: registrationAttributions.registrationId,
      attributionId: registrationAttributions.attributionId,
      promoCode: registrationAttributions.promoCode,
      amountUsdc: registrationAttributions.amountUsdc,
      registeredAt: registrationAttributions.registeredAt,
      affiliateId: registrationAttributions.affiliateId,
      affiliateSlug: affiliates.slug,
      affiliateName: affiliates.name,
      entityMinerHotkey: registrationAttributions.entityMinerHotkey,
      entityMinerSlug: entityMiners.slug,
      entityMinerName: entityMiners.name,
      userId: registrations.userId,
      userWallet: users.wallet,
      userEmail: users.email,
      hlAddress: registrations.hlAddress,
      accountSize: registrations.accountSize,
    })
    .from(registrationAttributions)
    .leftJoin(affiliates, eq(registrationAttributions.affiliateId, affiliates.id))
    .leftJoin(
      entityMiners,
      eq(registrationAttributions.entityMinerHotkey, entityMiners.hotkey),
    )
    .leftJoin(
      registrations,
      eq(registrationAttributions.registrationId, registrations.id),
    )
    .leftJoin(users, eq(registrations.userId, users.id))
    .where(where)
    .orderBy(desc(registrationAttributions.registeredAt))
    .limit(limit)
    .offset(offset);

  const totalP = db
    .select({ value: count() })
    .from(registrationAttributions)
    .where(where);

  const [rows, totalRows, stats] = await Promise.all([
    rowsP,
    totalP,
    getAttributionStats(rawFilters),
  ]);

  return {
    rows,
    total: totalRows[0]?.value ?? 0,
    page: safePage,
    pageSize: limit,
    filters: rawFilters,
    stats,
  };
}

export async function listAttributionRowsForExport(rawFilters = {}) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const f = await resolveFilters(db, rawFilters);

  const filters = regFilters(f);
  const where = filters.length > 0 ? and(...filters) : undefined;

  return await db
    .select({
      registrationId: registrationAttributions.registrationId,
      promoCode: registrationAttributions.promoCode,
      amountUsdc: registrationAttributions.amountUsdc,
      registeredAt: registrationAttributions.registeredAt,
      affiliateSlug: affiliates.slug,
      affiliateName: affiliates.name,
      entityMinerSlug: entityMiners.slug,
      entityMinerName: entityMiners.name,
      userWallet: users.wallet,
      userEmail: users.email,
      hlAddress: registrations.hlAddress,
      accountSize: registrations.accountSize,
    })
    .from(registrationAttributions)
    .leftJoin(affiliates, eq(registrationAttributions.affiliateId, affiliates.id))
    .leftJoin(
      entityMiners,
      eq(registrationAttributions.entityMinerHotkey, entityMiners.hotkey),
    )
    .leftJoin(
      registrations,
      eq(registrationAttributions.registrationId, registrations.id),
    )
    .leftJoin(users, eq(registrations.userId, users.id))
    .where(where)
    .orderBy(desc(registrationAttributions.registeredAt))
    .limit(MAX_EXPORT_ROWS);
}
