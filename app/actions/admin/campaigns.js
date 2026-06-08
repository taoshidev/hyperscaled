"use server";

import { and, arrayOverlaps, asc, desc, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import {
  promotionalCampaigns,
  coupons,
  couponRedemptions,
  entityMiners,
  entityTiers,
} from "@/lib/db/schema";
import { requireCommandCenterStaff } from "@/lib/auth/command-center.js";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const MAX_NOTES = 500;

const normalizeCode = (raw) => {
  if (raw == null) return "";
  return String(raw).trim().toUpperCase();
};

function normalizeSlug(raw) {
  if (raw == null) return "";
  return String(raw).trim().toLowerCase();
}

function ensureDate(value, label) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  throw new Error(`${label} must be a valid date.`);
}

function ensureWindow(startsAt, endsAt) {
  const s = ensureDate(startsAt, "startsAt");
  const e = ensureDate(endsAt, "endsAt");
  if (e <= s) {
    throw new Error("endsAt must be after startsAt.");
  }
  return { startsAt: s, endsAt: e };
}

function deriveStatusForWindow(now, startsAt, endsAt, requested) {
  if (requested === "ended") return "ended";
  if (requested === "draft") return "draft";
  if (now > endsAt) return "ended";
  // A paused campaign stays paused (admin must explicitly resume it) unless its
  // window has already elapsed, which the check above handles.
  if (requested === "paused") return "paused";
  if (now < startsAt) return "scheduled";
  if (requested === "active") return "active";
  return requested ?? "scheduled";
}

function normalizeNotes(raw) {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  return t.length > MAX_NOTES ? t.slice(0, MAX_NOTES) : t;
}

/**
 * Normalizes the targeted-tenant input into a clean string[] of hotkeys, or
 * `null` for a site-wide ("all brands") campaign. Empty / blank selections
 * collapse to `null` so the global sentinel is unambiguous.
 */
function normalizeTenantHotkeys(raw) {
  if (!Array.isArray(raw)) return null;
  const seen = new Set();
  for (const h of raw) {
    if (typeof h !== "string") continue;
    const t = h.trim();
    if (t) seen.add(t);
  }
  return seen.size ? Array.from(seen) : null;
}

function normalizeTierPriceOverrides(raw) {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const k = String(key).trim();
    if (!k) continue;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) continue;
    out[k] = Math.round(n * 100) / 100;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Correlated subquery returning the display names of a campaign's targeted
 * tenants as a `text[]`, ordered by name. Empty for site-wide campaigns.
 */
function minerNamesSql() {
  return sql`(
    select coalesce(array_agg(em.name order by em.name), array[]::text[])
    from ${entityMiners} em
    where em.hotkey = any(${promotionalCampaigns.entityMinerHotkeys})
  )`;
}

function toCampaignAdminRowClient(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    couponId: row.couponId,
    couponCode: row.couponCode,
    couponDiscountType: row.couponDiscountType,
    couponDiscountValue:
      row.couponDiscountValue == null ? null : String(row.couponDiscountValue),
    bannerEnabled: Boolean(row.bannerEnabled),
    bannerText: row.bannerText ?? null,
    tierPriceOverrides: row.tierPriceOverrides ?? null,
    entityMinerHotkeys: row.entityMinerHotkeys ?? [],
    minerNames: row.minerNames ?? [],
    createdByWallet: row.createdByWallet ?? null,
    notes: row.notes ?? null,
    redemptionCount: Number(row.redemptionCount ?? 0),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Enforces the "one active campaign per tenant" rule by displacing any other
 * currently-active campaign that overlaps the same tenant scope. Displaced
 * campaigns are set to `paused` (not `ended`) so they stay recoverable: their
 * window is untouched and an admin can resume them later.
 *
 * Scope rules (a campaign targets a set of hotkeys; empty = site-wide):
 *   - A site-wide campaign displaces other active site-wide campaigns. It does
 *     not pause tenant-specific campaigns — those win for their tenants and
 *     coexist as overrides on top of the global baseline.
 *   - A tenant-specific campaign displaces other active campaigns whose target
 *     set overlaps any of its hotkeys (so two campaigns can't both be active
 *     for the same tenant).
 *
 * @param {import('@/lib/db').Db} db
 * @param {string[]|null} hotkeys  Target tenants; null/empty = site-wide.
 * @param {string|null} [exceptCampaignId]
 */
async function deactivateOtherActive(db, hotkeys, exceptCampaignId) {
  const isGlobalTarget = !hotkeys || hotkeys.length === 0;
  const scopeCond = isGlobalTarget
    ? sql`(${promotionalCampaigns.entityMinerHotkeys} IS NULL OR cardinality(${promotionalCampaigns.entityMinerHotkeys}) = 0)`
    : arrayOverlaps(promotionalCampaigns.entityMinerHotkeys, hotkeys);

  const conds = [eq(promotionalCampaigns.status, "active"), scopeCond];
  if (exceptCampaignId) conds.push(ne(promotionalCampaigns.id, exceptCampaignId));

  await db
    .update(promotionalCampaigns)
    .set({ status: "paused", updatedAt: new Date() })
    .where(and(...conds));
}

async function findOrCreateCouponForCampaign(db, opts, staffWallet) {
  const code = normalizeCode(opts.code);
  if (!code) throw new Error("Coupon code is required.");

  const [existing] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);

  if (existing) {
    if (
      opts.discountType &&
      (opts.discountType !== existing.discountType ||
        Number(opts.discountValue) !== Number(existing.discountValue))
    ) {
      await db
        .update(coupons)
        .set({
          discountType: opts.discountType,
          discountValue: String(opts.discountValue),
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, existing.id));
    }
    if (opts.startsAt && opts.endsAt) {
      await db
        .update(coupons)
        .set({
          validFrom: opts.startsAt,
          validUntil: opts.endsAt,
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, existing.id));
    }
    return existing.id;
  }

  if (!opts.discountType || opts.discountValue == null) {
    throw new Error(
      "Coupon does not exist; provide discountType + discountValue to create it.",
    );
  }

  const [inserted] = await db
    .insert(coupons)
    .values({
      code,
      discountType: opts.discountType,
      discountValue: String(opts.discountValue),
      useType: "unlimited",
      maxUses: null,
      allowedEmails: null,
      allowedTierIds: null,
      validFrom: opts.startsAt ?? null,
      validUntil: opts.endsAt ?? null,
      createdByWallet: staffWallet,
    })
    .returning({ id: coupons.id });
  if (!inserted) throw new Error("Failed to create coupon.");
  return inserted.id;
}

export async function listCampaigns() {
  await requireCommandCenterStaff();
  const db = await getDb();

  const redemptionCountSq = sql`(
    select count(*)::int from ${couponRedemptions}
    where ${couponRedemptions.couponId} = ${promotionalCampaigns.couponId}
  )`;

  const rows = await db
    .select({
      id: promotionalCampaigns.id,
      name: promotionalCampaigns.name,
      slug: promotionalCampaigns.slug,
      status: promotionalCampaigns.status,
      startsAt: promotionalCampaigns.startsAt,
      endsAt: promotionalCampaigns.endsAt,
      couponId: promotionalCampaigns.couponId,
      couponCode: coupons.code,
      couponDiscountType: coupons.discountType,
      couponDiscountValue: coupons.discountValue,
      bannerEnabled: promotionalCampaigns.bannerEnabled,
      bannerText: promotionalCampaigns.bannerText,
      tierPriceOverrides: promotionalCampaigns.tierPriceOverrides,
      entityMinerHotkeys: promotionalCampaigns.entityMinerHotkeys,
      minerNames: minerNamesSql(),
      createdByWallet: promotionalCampaigns.createdByWallet,
      notes: promotionalCampaigns.notes,
      redemptionCount: redemptionCountSq,
      createdAt: promotionalCampaigns.createdAt,
      updatedAt: promotionalCampaigns.updatedAt,
    })
    .from(promotionalCampaigns)
    .innerJoin(coupons, eq(coupons.id, promotionalCampaigns.couponId))
    .orderBy(
      desc(promotionalCampaigns.status),
      desc(promotionalCampaigns.startsAt),
    );

  return rows.map(toCampaignAdminRowClient);
}

export async function getCampaign(id) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const [row] = await db
    .select({
      id: promotionalCampaigns.id,
      name: promotionalCampaigns.name,
      slug: promotionalCampaigns.slug,
      status: promotionalCampaigns.status,
      startsAt: promotionalCampaigns.startsAt,
      endsAt: promotionalCampaigns.endsAt,
      couponId: promotionalCampaigns.couponId,
      couponCode: coupons.code,
      couponDiscountType: coupons.discountType,
      couponDiscountValue: coupons.discountValue,
      bannerEnabled: promotionalCampaigns.bannerEnabled,
      bannerText: promotionalCampaigns.bannerText,
      tierPriceOverrides: promotionalCampaigns.tierPriceOverrides,
      entityMinerHotkeys: promotionalCampaigns.entityMinerHotkeys,
      minerNames: minerNamesSql(),
      createdByWallet: promotionalCampaigns.createdByWallet,
      notes: promotionalCampaigns.notes,
      redemptionCount: sql`0::int`,
      createdAt: promotionalCampaigns.createdAt,
      updatedAt: promotionalCampaigns.updatedAt,
    })
    .from(promotionalCampaigns)
    .innerJoin(coupons, eq(coupons.id, promotionalCampaigns.couponId))
    .where(eq(promotionalCampaigns.id, id))
    .limit(1);
  if (!row) return null;
  return toCampaignAdminRowClient(row);
}

export async function listCampaignCouponChoices() {
  await requireCommandCenterStaff();
  const db = await getDb();
  const rows = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      discountType: coupons.discountType,
      discountValue: coupons.discountValue,
    })
    .from(coupons)
    .orderBy(asc(coupons.code))
    .limit(500);
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    discountType: r.discountType,
    discountValue: String(r.discountValue),
  }));
}

export async function listCampaignTenantChoices() {
  await requireCommandCenterStaff();
  const db = await getDb();
  const rows = await db
    .select({
      hotkey: entityMiners.hotkey,
      slug: entityMiners.slug,
      name: entityMiners.name,
    })
    .from(entityMiners)
    .where(eq(entityMiners.isActive, true))
    .orderBy(asc(entityMiners.name));
  return [
    { value: "", label: "All brands (global)" },
    ...rows.map((r) => ({
      value: r.hotkey,
      label: `${r.name} (${r.slug})`,
    })),
  ];
}

export async function listCampaignTierChoices() {
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

  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (!r.isMinerActive || !r.isTierActive) continue;
    const k = String(r.accountSize);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      accountSize: r.accountSize,
      label: `$${(r.accountSize / 1000).toLocaleString()}K`,
    });
  }
  return out.sort((a, b) => a.accountSize - b.accountSize);
}

export async function createCampaign(input) {
  const staff = await requireCommandCenterStaff();
  const db = await getDb();

  const name = String(input.name ?? "").trim();
  const slug = normalizeSlug(input.slug ?? name);
  if (!name) return { success: false, error: "Name is required." };
  if (!SLUG_RE.test(slug)) {
    return {
      success: false,
      error: "Slug must be lowercase letters, numbers, or dashes.",
    };
  }
  let window;
  try {
    window = ensureWindow(input.startsAt, input.endsAt);
  } catch (e) {
    return { success: false, error: e.message };
  }

  const tenantHotkeys = normalizeTenantHotkeys(input.entityMinerHotkeys);

  let couponId;
  try {
    couponId = await findOrCreateCouponForCampaign(
      db,
      {
        couponId: input.couponId ?? null,
        code: input.couponCode,
        discountType: input.couponDiscountType,
        discountValue: input.couponDiscountValue,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
      },
      staff.wallet,
    );
  } catch (e) {
    return { success: false, error: e.message };
  }

  const status = deriveStatusForWindow(
    new Date(),
    window.startsAt,
    window.endsAt,
    input.status ?? "draft",
  );

  try {
    if (status === "active") {
      await deactivateOtherActive(db, tenantHotkeys, null);
    }
    const [inserted] = await db
      .insert(promotionalCampaigns)
      .values({
        name,
        slug,
        status,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        couponId,
        bannerEnabled: input.bannerEnabled ?? true,
        bannerText:
          typeof input.bannerText === "string"
            ? input.bannerText.trim() || null
            : null,
        tierPriceOverrides: normalizeTierPriceOverrides(input.tierPriceOverrides),
        entityMinerHotkeys: tenantHotkeys,
        createdByWallet: staff.wallet,
        notes: normalizeNotes(input.notes),
      })
      .returning({ id: promotionalCampaigns.id });
    if (!inserted) {
      return { success: false, error: "Failed to insert campaign." };
    }
    revalidatePath("/command-center/campaigns");
    revalidatePath("/", "layout");
    return { success: true, id: inserted.id };
  } catch (e) {
    if (e?.code === "23505") {
      return { success: false, error: "Slug must be unique." };
    }
    console.error("createCampaign:", e);
    return { success: false, error: e?.message ?? "Failed to create campaign." };
  }
}

export async function updateCampaign(id, input) {
  const staff = await requireCommandCenterStaff();
  const db = await getDb();

  const [existing] = await db
    .select()
    .from(promotionalCampaigns)
    .where(eq(promotionalCampaigns.id, id))
    .limit(1);
  if (!existing) return { success: false, error: "Campaign not found." };

  const name = (input.name ?? existing.name).trim();
  const slug = normalizeSlug(input.slug ?? existing.slug);
  if (!name) return { success: false, error: "Name is required." };
  if (!SLUG_RE.test(slug)) {
    return { success: false, error: "Slug is invalid." };
  }

  let window;
  try {
    window = ensureWindow(
      input.startsAt ?? existing.startsAt,
      input.endsAt ?? existing.endsAt,
    );
  } catch (e) {
    return { success: false, error: e.message };
  }

  let couponId = existing.couponId;
  if (input.couponId || input.couponCode) {
    try {
      couponId = await findOrCreateCouponForCampaign(
        db,
        {
          couponId: input.couponId ?? null,
          code: input.couponCode,
          discountType: input.couponDiscountType,
          discountValue: input.couponDiscountValue,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
        },
        staff.wallet,
      );
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  const tenantHotkeys = Object.prototype.hasOwnProperty.call(
    input,
    "entityMinerHotkeys",
  )
    ? normalizeTenantHotkeys(input.entityMinerHotkeys)
    : existing.entityMinerHotkeys ?? null;

  const status = deriveStatusForWindow(
    new Date(),
    window.startsAt,
    window.endsAt,
    input.status ?? existing.status,
  );

  try {
    if (status === "active") {
      await deactivateOtherActive(db, tenantHotkeys, id);
    }

    const [updated] = await db
      .update(promotionalCampaigns)
      .set({
        name,
        slug,
        status,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        couponId,
        bannerEnabled:
          input.bannerEnabled ?? existing.bannerEnabled,
        bannerText: Object.prototype.hasOwnProperty.call(input, "bannerText")
          ? input.bannerText?.trim() || null
          : existing.bannerText,
        tierPriceOverrides: Object.prototype.hasOwnProperty.call(
          input,
          "tierPriceOverrides",
        )
          ? normalizeTierPriceOverrides(input.tierPriceOverrides)
          : existing.tierPriceOverrides,
        entityMinerHotkeys: tenantHotkeys,
        notes: Object.prototype.hasOwnProperty.call(input, "notes")
          ? normalizeNotes(input.notes)
          : existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(promotionalCampaigns.id, id))
      .returning({ id: promotionalCampaigns.id });

    if (!updated) {
      return { success: false, error: "Update failed." };
    }
    revalidatePath("/command-center/campaigns");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    if (e?.code === "23505") {
      return { success: false, error: "Slug must be unique." };
    }
    console.error("updateCampaign:", e);
    return { success: false, error: e?.message ?? "Failed to update campaign." };
  }
}

export async function activateCampaign(id) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const [row] = await db
    .select()
    .from(promotionalCampaigns)
    .where(eq(promotionalCampaigns.id, id))
    .limit(1);
  if (!row) return { success: false, error: "Campaign not found." };

  const now = new Date();
  if (row.endsAt <= now) {
    return { success: false, error: "Cannot activate a campaign whose end date has passed." };
  }
  try {
    await deactivateOtherActive(db, row.entityMinerHotkeys, id);
    await db
      .update(promotionalCampaigns)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(promotionalCampaigns.id, id));
    revalidatePath("/command-center/campaigns");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    console.error("activateCampaign:", e);
    return { success: false, error: e?.message ?? "Failed to activate campaign." };
  }
}

export async function pauseCampaign(id) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const [row] = await db
    .select({ id: promotionalCampaigns.id, status: promotionalCampaigns.status })
    .from(promotionalCampaigns)
    .where(eq(promotionalCampaigns.id, id))
    .limit(1);
  if (!row) return { success: false, error: "Campaign not found." };
  if (row.status !== "active") {
    return { success: false, error: "Only active campaigns can be paused." };
  }
  try {
    await db
      .update(promotionalCampaigns)
      .set({ status: "paused", updatedAt: new Date() })
      .where(eq(promotionalCampaigns.id, id));
    revalidatePath("/command-center/campaigns");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    console.error("pauseCampaign:", e);
    return { success: false, error: e?.message ?? "Failed to pause campaign." };
  }
}

export async function resumeCampaign(id) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const [row] = await db
    .select()
    .from(promotionalCampaigns)
    .where(eq(promotionalCampaigns.id, id))
    .limit(1);
  if (!row) return { success: false, error: "Campaign not found." };
  if (row.status !== "paused") {
    return { success: false, error: "Only paused campaigns can be resumed." };
  }
  // Resume back into the lifecycle the window dictates: live now → active,
  // future → scheduled, past → ended.
  const nextStatus = deriveStatusForWindow(
    new Date(),
    row.startsAt,
    row.endsAt,
    "active",
  );
  try {
    if (nextStatus === "active") {
      await deactivateOtherActive(db, row.entityMinerHotkeys, id);
    }
    await db
      .update(promotionalCampaigns)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(promotionalCampaigns.id, id));
    revalidatePath("/command-center/campaigns");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    console.error("resumeCampaign:", e);
    return { success: false, error: e?.message ?? "Failed to resume campaign." };
  }
}

export async function endCampaign(id) {
  await requireCommandCenterStaff();
  const db = await getDb();
  const [updated] = await db
    .update(promotionalCampaigns)
    .set({ status: "ended", endsAt: new Date(), updatedAt: new Date() })
    .where(eq(promotionalCampaigns.id, id))
    .returning({ id: promotionalCampaigns.id });
  if (!updated) return { success: false, error: "Campaign not found." };
  revalidatePath("/command-center/campaigns");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteCampaign(id) {
  await requireCommandCenterStaff();
  const db = await getDb();

  const [row] = await db
    .select({ status: promotionalCampaigns.status })
    .from(promotionalCampaigns)
    .where(eq(promotionalCampaigns.id, id))
    .limit(1);
  if (!row) return { success: false, error: "Campaign not found." };
  if (row.status === "active") {
    return {
      success: false,
      error: "End the campaign before deleting it.",
    };
  }

  const [deleted] = await db
    .delete(promotionalCampaigns)
    .where(eq(promotionalCampaigns.id, id))
    .returning({ id: promotionalCampaigns.id });
  if (!deleted) return { success: false, error: "Delete failed." };
  revalidatePath("/command-center/campaigns");
  return { success: true };
}
