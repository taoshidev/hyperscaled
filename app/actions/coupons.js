"use server";

import crypto from "node:crypto";

import {
  eq,
  and,
  desc,
  asc,
  inArray,
  count,
  sql,
  ilike,
  notExists,
} from "drizzle-orm";

import { getDb } from "@/lib/db/index.js";
import {
  coupons,
  couponRedemptions,
  users,
  entityMiners,
  entityTiers,
} from "@/lib/db/schema.js";
import { requireCommandCenterStaff } from "@/lib/auth/command-center.js";
import { parseAdminSort } from "@/lib/admin/command-center-sort.js";

const DEFAULT_COUPONS_PAGE_SIZE = 20;
const MAX_COUPONS_PAGE_SIZE = 100;
const MAX_COUPON_CSV_EXPORT = 10_000;

const MAX_DELETE_UNREDEEMED_PER_CALL = 5_000;

const COUPON_LIST_SORT_COLUMNS = [
  "code",
  "discountType",
  "discountValue",
  "useType",
  "redemptionCount",
  "validUntil",
  "createdAt",
];

const DEFAULT_COUPON_CODE_PREFIX = "HS";

const normalizeCode = (code) => code.trim().toUpperCase();

function normalizeCouponMaxUses(useType, raw) {
  if (useType === "one_time") return null;
  if (raw == null || !Number.isFinite(raw)) return null;
  const n = Math.floor(Number(raw));
  return n >= 1 ? n : null;
}

function normalizeAllowedEmailsList(raw) {
  if (raw == null || raw.length === 0) return null;
  const out = [
    ...new Set(raw.map((e) => String(e).trim().toLowerCase()).filter(Boolean)),
  ];
  return out.length ? out : null;
}

function normalizeAllowedTierIds(raw) {
  if (raw == null || raw.length === 0) return null;
  const out = [
    ...new Set(raw.map((e) => String(e).trim()).filter(Boolean)),
  ];
  return out.length ? out : null;
}

function couponTabSqlWhere(tab) {
  if (tab === "percent") {
    return eq(coupons.discountType, "percent");
  }
  if (tab === "fixed") {
    return eq(coupons.discountType, "fixed");
  }
  if (tab === "tier_restricted") {
    return sql`(${coupons.allowedTierIds} is not null and jsonb_array_length(coalesce(${coupons.allowedTierIds}, '[]'::jsonb)) > 0)`;
  }
  return undefined;
}

function couponsAdminOrderBy(column, dir, redemptionCountSq) {
  const d = dir === "desc" ? desc : asc;
  const tie = desc(coupons.id);
  const discountNum = sql`(${coupons.discountValue})::numeric`;
  switch (column) {
    case "code":
      return [d(coupons.code), tie];
    case "discountType":
      return [d(coupons.discountType), tie];
    case "discountValue":
      return dir === "desc"
        ? [desc(discountNum), tie]
        : [asc(discountNum), tie];
    case "useType":
      return [d(coupons.useType), tie];
    case "redemptionCount":
      return dir === "desc"
        ? [desc(redemptionCountSq), tie]
        : [asc(redemptionCountSq), tie];
    case "validUntil":
      return [d(coupons.validUntil), tie];
    case "createdAt":
      return [d(coupons.createdAt), tie];
    default:
      return [desc(coupons.createdAt), tie];
  }
}

function toCouponAdminRowClient(row) {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discountType,
    discountValue: row.discountValue,
    useType: row.useType,
    maxUses: row.maxUses,
    allowedEmails: row.allowedEmails ?? null,
    allowedTierIds: row.allowedTierIds ?? null,
    redemptionCount: row.redemptionCount,
    validFrom: row.validFrom?.toISOString() ?? null,
    validUntil: row.validUntil?.toISOString() ?? null,
    createdByWallet: row.createdByWallet ?? null,
    createdAt: row.createdAt.toISOString(),
    redemptions: row.redemptions.map((r) => ({
      userId: r.userId,
      userWallet: r.userWallet,
      userEmail: r.userEmail,
      redeemedAt: r.redeemedAt.toISOString(),
      paymentIntentId: r.paymentIntentId,
    })),
  };
}

// Excludes 0/O/1/I to keep typed codes unambiguous.
const RANDOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCodeChunk(len) {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += RANDOM_CODE_ALPHABET[bytes[i] % RANDOM_CODE_ALPHABET.length];
  }
  return out;
}

function randomCodeServer() {
  return `${DEFAULT_COUPON_CODE_PREFIX}-${randomCodeChunk(4)}-${randomCodeChunk(4)}`;
}

export async function listAdminCouponsPage(options) {
  await requireCommandCenterStaff();
  const db = await getDb();

  const tab = options.tab ?? "all";
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(
    MAX_COUPONS_PAGE_SIZE,
    Math.max(1, options.pageSize ?? DEFAULT_COUPONS_PAGE_SIZE)
  );
  const offset = (page - 1) * pageSize;

  const sortState = parseAdminSort(
    options.sort?.trim(),
    options.dir?.trim(),
    COUPON_LIST_SORT_COLUMNS,
    { column: "createdAt", dir: "desc" }
  );

  const tabCond = couponTabSqlWhere(tab);
  const whereClause = tabCond ? and(tabCond) : undefined;

  const [countRow] = await db
    .select({ c: count() })
    .from(coupons)
    .where(whereClause);

  const total = Number(countRow?.c ?? 0);

  const redemptionCountSq = sql`(
    select count(*)::int from ${couponRedemptions}
    where ${couponRedemptions.couponId} = ${coupons.id}
  )`;

  const couponSlice = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      discountType: coupons.discountType,
      discountValue: coupons.discountValue,
      useType: coupons.useType,
      maxUses: coupons.maxUses,
      allowedEmails: coupons.allowedEmails,
      allowedTierIds: coupons.allowedTierIds,
      validFrom: coupons.validFrom,
      validUntil: coupons.validUntil,
      createdByWallet: coupons.createdByWallet,
      createdAt: coupons.createdAt,
    })
    .from(coupons)
    .where(whereClause)
    .orderBy(...couponsAdminOrderBy(sortState.column, sortState.dir, redemptionCountSq))
    .limit(pageSize)
    .offset(offset);

  const ids = couponSlice.map((c) => c.id);

  const redemptionRows =
    ids.length === 0
      ? []
      : await db
          .select({
            couponId: couponRedemptions.couponId,
            userId: users.id,
            userWallet: users.wallet,
            userEmail: users.email,
            redeemedAt: couponRedemptions.redeemedAt,
            paymentIntentId: couponRedemptions.paymentIntentId,
          })
          .from(couponRedemptions)
          .innerJoin(users, eq(couponRedemptions.userId, users.id))
          .where(inArray(couponRedemptions.couponId, ids));

  const byCouponId = new Map();
  for (const r of redemptionRows) {
    const list = byCouponId.get(r.couponId) ?? [];
    list.push({
      userId: r.userId,
      userWallet: r.userWallet,
      userEmail: r.userEmail,
      redeemedAt: r.redeemedAt,
      paymentIntentId: r.paymentIntentId,
    });
    byCouponId.set(r.couponId, list);
  }

  const rowsBuilt = couponSlice.map((c) => {
    const redemptions = byCouponId.get(c.id) ?? [];
    return {
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      useType: c.useType,
      maxUses: c.maxUses,
      allowedEmails: Array.isArray(c.allowedEmails) ? c.allowedEmails : null,
      allowedTierIds: Array.isArray(c.allowedTierIds) ? c.allowedTierIds : null,
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      createdByWallet: c.createdByWallet ?? null,
      createdAt: c.createdAt,
      redemptionCount: redemptions.length,
      redemptions,
    };
  });

  return {
    rows: rowsBuilt.map(toCouponAdminRowClient),
    total,
    page,
    pageSize,
    tab,
    sort: {
      activeSort: sortState.activeSort,
      activeDir: sortState.activeDir,
    },
  };
}

export async function fetchCouponsForAdminCsvExport(tab, maxRows) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const cap = Math.min(Math.max(1, maxRows), MAX_COUPON_CSV_EXPORT);
  const tabCond = couponTabSqlWhere(tab);
  const whereClause = tabCond ? and(tabCond) : undefined;

  const slice = await db
    .select()
    .from(coupons)
    .where(whereClause)
    .orderBy(desc(coupons.createdAt))
    .limit(cap);

  if (slice.length === 0) return [];

  const ids = slice.map((c) => c.id);
  const redemptionRows = await db
    .select({
      couponId: couponRedemptions.couponId,
      userId: users.id,
      userWallet: users.wallet,
      userEmail: users.email,
      redeemedAt: couponRedemptions.redeemedAt,
      paymentIntentId: couponRedemptions.paymentIntentId,
    })
    .from(couponRedemptions)
    .innerJoin(users, eq(couponRedemptions.userId, users.id))
    .where(inArray(couponRedemptions.couponId, ids));

  const byCouponId = new Map();
  for (const r of redemptionRows) {
    const list = byCouponId.get(r.couponId) ?? [];
    list.push({
      userId: r.userId,
      userWallet: r.userWallet,
      userEmail: r.userEmail,
      redeemedAt: r.redeemedAt,
      paymentIntentId: r.paymentIntentId,
    });
    byCouponId.set(r.couponId, list);
  }

  return slice.map((c) => {
    const redemptions = byCouponId.get(c.id) ?? [];
    return {
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      useType: c.useType,
      maxUses: c.maxUses,
      allowedEmails: Array.isArray(c.allowedEmails) ? c.allowedEmails : null,
      allowedTierIds: Array.isArray(c.allowedTierIds) ? c.allowedTierIds : null,
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      createdByWallet: c.createdByWallet ?? null,
      createdAt: c.createdAt,
      redemptionCount: redemptions.length,
      redemptions,
    };
  });
}

export async function createCoupon(input) {
  const staff = await requireCommandCenterStaff();
  const db = await getDb();

  const code = normalizeCode(input.code);
  if (!code) {
    return { success: false, error: "Code is required." };
  }
  const useType = input.useType ?? "one_time";
  try {
    const [inserted] = await db
      .insert(coupons)
      .values({
        code,
        discountType: input.discountType,
        discountValue: String(input.discountValue),
        useType,
        validFrom: input.validFrom ?? null,
        validUntil: input.validUntil ?? null,
        allowedEmails: normalizeAllowedEmailsList(input.allowedEmails ?? null),
        allowedTierIds: normalizeAllowedTierIds(input.allowedTierIds ?? null),
        maxUses: normalizeCouponMaxUses(useType, input.maxUses ?? undefined),
        createdByWallet: staff.wallet,
      })
      .returning({ id: coupons.id });
    if (!inserted) return { success: false, error: "Insert failed." };
    return { success: true, id: inserted.id };
  } catch (e) {
    if (e?.code === "23505") {
      return {
        success: false,
        error: "A coupon with this code already exists.",
      };
    }
    console.error("createCoupon:", e);
    return { success: false, error: e?.message ?? "Failed to create coupon." };
  }
}

export async function createCouponsBatch(input) {
  const staff = await requireCommandCenterStaff();
  const db = await getDb();

  const total = Math.min(Math.max(1, Math.floor(input.count)), 100);
  const useType = input.useType ?? "one_time";
  const values = {
    discountType: input.discountType,
    discountValue: String(input.discountValue),
    useType,
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
    allowedEmails: normalizeAllowedEmailsList(input.allowedEmails ?? null),
    allowedTierIds: normalizeAllowedTierIds(input.allowedTierIds ?? null),
    maxUses: normalizeCouponMaxUses(useType, input.maxUses ?? undefined),
    createdByWallet: staff.wallet,
  };
  let created = 0;
  const maxRetries = 10;
  for (let i = 0; i < total; i++) {
    let code = normalizeCode(randomCodeServer());
    let inserted = false;
    let lastErr = null;
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        await db.insert(coupons).values({ code, ...values });
        created++;
        inserted = true;
        break;
      } catch (e) {
        lastErr = e;
        if (e?.code === "23505") {
          code = normalizeCode(randomCodeServer());
          continue;
        }
        console.error("createCouponsBatch:", e);
        return {
          success: false,
          error: e?.message ?? "Failed to create coupons.",
          requested: total,
          created,
        };
      }
    }
    if (!inserted) {
      console.error("createCouponsBatch: code-collision retries exhausted", {
        i,
        created,
        requested: total,
        lastErr: lastErr?.message,
      });
      return {
        success: false,
        partial: created > 0,
        error:
          "Coupon code collisions exhausted retries. Some codes may have been created.",
        requested: total,
        created,
      };
    }
  }
  return { success: true, requested: total, created };
}

export async function invalidateAllCoupons() {
  await requireCommandCenterStaff();
  const db = await getDb();
  try {
    const now = new Date();
    const result = await db
      .update(coupons)
      .set({ validUntil: now, updatedAt: now })
      .returning({ id: coupons.id });
    return { success: true, count: result.length };
  } catch (e) {
    console.error("invalidateAllCoupons:", e);
    return { success: false, error: e?.message ?? "Failed to invalidate." };
  }
}

function unredeemedCouponPredicate() {
  return notExists(
    sql`select 1 from ${couponRedemptions} where ${couponRedemptions.couponId} = ${coupons.id}`,
  );
}

export async function deleteUnredeemedCoupons(options = {}) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const dryRun = options.dryRun === true;

  try {
    const [cntRow] = await db
      .select({ c: count() })
      .from(coupons)
      .where(unredeemedCouponPredicate());
    const candidateCount = Number(cntRow?.c ?? 0);

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        candidateCount,
        maxPerCall: MAX_DELETE_UNREDEEMED_PER_CALL,
      };
    }

    if (candidateCount === 0) {
      return {
        success: true,
        deletedCount: 0,
        candidateCount: 0,
        remainingCandidateCount: 0,
        maxPerCall: MAX_DELETE_UNREDEEMED_PER_CALL,
      };
    }

    const candidateIdsSubquery = db
      .select({ id: coupons.id })
      .from(coupons)
      .where(unredeemedCouponPredicate())
      .limit(MAX_DELETE_UNREDEEMED_PER_CALL);

    const deleted = await db
      .delete(coupons)
      .where(inArray(coupons.id, candidateIdsSubquery))
      .returning({ id: coupons.id });

    const deletedCount = deleted.length;
    const remainingCandidateCount = Math.max(
      0,
      candidateCount - deletedCount,
    );

    return {
      success: true,
      deletedCount,
      candidateCount,
      remainingCandidateCount,
      maxPerCall: MAX_DELETE_UNREDEEMED_PER_CALL,
    };
  } catch (e) {
    console.error("deleteUnredeemedCoupons:", e);
    return { success: false, error: e?.message ?? "Failed to delete." };
  }
}

export async function getCouponCommandCenterStats() {
  await requireCommandCenterStaff();
  const db = await getDb();

  const [totalCouponsRow] = await db.select({ c: count() }).from(coupons);
  const [totalRedemptionsRow] = await db
    .select({ c: count() })
    .from(couponRedemptions);
  const distinctRedeemed = await db
    .selectDistinct({ couponId: couponRedemptions.couponId })
    .from(couponRedemptions);

  const discountGroups = await db
    .select({ discountType: coupons.discountType, c: count() })
    .from(coupons)
    .groupBy(coupons.discountType);

  const useGroups = await db
    .select({ useType: coupons.useType, c: count() })
    .from(coupons)
    .groupBy(coupons.useType);

  const byDiscountType = { percent: 0, fixed: 0 };
  for (const row of discountGroups) {
    if (row.discountType === "percent") byDiscountType.percent = Number(row.c);
    else if (row.discountType === "fixed") byDiscountType.fixed = Number(row.c);
  }

  const byUseType = { one_time: 0, multi_use: 0, unlimited: 0 };
  for (const row of useGroups) {
    if (row.useType in byUseType) byUseType[row.useType] = Number(row.c);
  }

  return {
    totalCoupons: Number(totalCouponsRow?.c ?? 0),
    totalRedemptionEvents: Number(totalRedemptionsRow?.c ?? 0),
    couponsWithRedemption: distinctRedeemed.length,
    byDiscountType,
    byUseType,
  };
}

export async function listCouponAdminTierChoices() {
  await requireCommandCenterStaff();
  const db = await getDb();

  const rows = await db
    .select({
      slug: entityMiners.slug,
      minerName: entityMiners.name,
      accountSize: entityTiers.accountSize,
      isMinerActive: entityMiners.isActive,
      isTierActive: entityTiers.isActive,
    })
    .from(entityTiers)
    .innerJoin(entityMiners, eq(entityTiers.hotkey, entityMiners.hotkey))
    .orderBy(asc(entityMiners.slug), asc(entityTiers.accountSize));

  return rows
    .filter((r) => r.isMinerActive && r.isTierActive)
    .map((r) => ({
      value: `${r.slug}:${r.accountSize}`,
      label: `${r.minerName} — $${(r.accountSize / 1000).toLocaleString()}K`,
    }));
}

export async function searchUserEmailsForCouponAdmin(opts) {
  await requireCommandCenterStaff();
  const db = await getDb();

  const raw = opts?.q?.trim() ?? "";
  const safe = raw.replace(/%/g, "").replace(/_/g, "").slice(0, 160);

  const whereClause =
    safe.length > 0 ? ilike(users.email, `%${safe}%`) : undefined;

  return db
    .select({ id: users.id, email: users.email, wallet: users.wallet })
    .from(users)
    .where(whereClause)
    .orderBy(asc(users.email))
    .limit(50);
}
