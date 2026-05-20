import { eq, count, and, sql } from "drizzle-orm";

import {
  coupons,
  couponRedemptions,
} from "@/lib/db/schema";
import { isAnyDevTestWallet, DEV_TEST_PRICE } from "@/lib/dev-test";
import {
  checkoutTierAllowsCoupon,
  computeCouponDiscount,
} from "@/lib/checkout-coupon-rules";
import { listPriceUsdcFromDbTier } from "@/lib/wsb-tier-list-price";

function normalizeCouponCode(raw) {
  if (raw == null) return "";
  const t = String(raw).trim().toUpperCase();
  return t.length ? t : "";
}

/** @typedef {{ couponId: string; code: string; discountType: "percent"|"fixed"; discountValue: number }} CouponApplyMeta */

export function applyCouponToAmount(meta, amountUsd) {
  if (!meta) return amountUsd;
  return computeCouponDiscount(
    meta.discountType,
    meta.discountValue,
    Number(amountUsd),
  ).finalAmount;
}

async function loadCouponEligibleMeta(db, code, tierSlug, email) {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);

  if (!coupon) {
    return {
      ok: false,
      error: "Invalid or expired coupon code.",
    };
  }

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) {
    return { ok: false, error: "This coupon is not yet valid." };
  }
  if (coupon.validUntil && now > coupon.validUntil) {
    return { ok: false, error: "This coupon has expired." };
  }

  if (coupon.useType === "one_time") {
    const [redemption] = await db
      .select({ id: couponRedemptions.id })
      .from(couponRedemptions)
      .where(eq(couponRedemptions.couponId, coupon.id))
      .limit(1);
    if (redemption) {
      return {
        ok: false,
        error: "This coupon has already been used.",
      };
    }
  }

  if (coupon.useType !== "one_time") {
    const [cntRow] = await db
      .select({ c: count() })
      .from(couponRedemptions)
      .where(eq(couponRedemptions.couponId, coupon.id));
    const redemptionTotal = Number(cntRow?.c ?? 0);
    if (
      coupon.maxUses != null &&
      redemptionTotal >= coupon.maxUses
    ) {
      return {
        ok: false,
        error: "This coupon has reached its maximum number of uses.",
      };
    }
  }

  /** @type {string[] | null | undefined} */
  const allowedEmails = coupon.allowedEmails;
  if (
    allowedEmails &&
    Array.isArray(allowedEmails) &&
    allowedEmails.length > 0
  ) {
    const emailLower = String(email ?? "").trim().toLowerCase();
    if (
      !allowedEmails.some(
        /** @param {string} e */ (e) => String(e).toLowerCase().trim() === emailLower,
      )
    ) {
      return {
        ok: false,
        error: "This coupon is not valid for your email.",
      };
    }
  }

  /** @type {string[] | null | undefined} */
  const tierIds =
    coupon.allowedTierIds == null ? null : /** @type {string[]} */ (coupon.allowedTierIds);
  if (
    tierIds &&
    tierIds.length > 0 &&
    !checkoutTierAllowsCoupon(tierIds, tierSlug)
  ) {
    return {
      ok: false,
      error: "This coupon is not valid for the selected challenge tier.",
    };
  }

  return {
    ok: true,
    meta: {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
    },
  };
}

export async function evaluateRegistrationPricing(
  db,
  miner,
  tier,
  hlAddress,
  hlTransferSender,
  email,
  couponCodeRaw,
) {
  const tierListPrice = listPriceUsdcFromDbTier(
    miner.slug,
    tier.accountSize,
    tier.priceUsdc,
  );
  const devTest = isAnyDevTestWallet(
    hlAddress,
    hlTransferSender ?? undefined,
  );
  const baseAfterDev = devTest ? DEV_TEST_PRICE : tierListPrice;

  const tierSlug = `${miner.slug}:${tier.accountSize}`;

  /** @type {CouponApplyMeta | null} */
  let couponMeta = null;

  const code = normalizeCouponCode(couponCodeRaw);
  if (code) {
    const loaded = await loadCouponEligibleMeta(db, code, tierSlug, email);
    if (!loaded.ok) {
      return loaded;
    }
    couponMeta = loaded.meta ?? null;
  }

  const effectivePrice = applyCouponToAmount(couponMeta, baseAfterDev);
  let discountAmount = 0;
  if (couponMeta) {
    const d = computeCouponDiscount(
      couponMeta.discountType,
      couponMeta.discountValue,
      baseAfterDev,
    );
    discountAmount = d.discountAmount;
  }

  return {
    ok: true,
    tierSlug,
    tierListPrice,
    devTest,
    baseAfterDev,
    couponMeta,
    discountAmount,
    effectivePrice,
  };
}

export async function recordRegistrationCouponRedemption(
  db,
  { couponId, userId, paymentIntentId },
) {
  if (!couponId || !Number.isFinite(userId)) return { ok: true };

  if (typeof db.transaction !== "function") {
    return runRedemptionStep(db, { couponId, userId, paymentIntentId });
  }

  try {
    return await db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`select id, use_type, max_uses from coupons where id = ${couponId} for update`,
      );
      const lockedRow = Array.isArray(locked)
        ? locked[0]
        : locked?.rows?.[0] ?? null;
      if (!lockedRow) {
        return { ok: false, error: "Coupon not found." };
      }
      return runRedemptionStep(tx, {
        couponId,
        userId,
        paymentIntentId,
        lockedUseType: lockedRow.use_type ?? lockedRow.useType,
        lockedMaxUses: lockedRow.max_uses ?? lockedRow.maxUses ?? null,
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("recordRegistrationCouponRedemption:", e);
    return { ok: false, error: msg };
  }
}

export const COUPON_RESERVATION_ERRORS = {
  ALREADY_REDEEMED: "ALREADY_REDEEMED",
  LIMIT_REACHED: "LIMIT_REACHED",
  NOT_FOUND: "NOT_FOUND",
  DB_ERROR: "DB_ERROR",
};

export async function reserveCouponRedemption(
  db,
  { couponId, userId },
) {
  if (!couponId) {
    return {
      ok: false,
      code: COUPON_RESERVATION_ERRORS.NOT_FOUND,
      error: "Missing couponId.",
    };
  }
  if (!Number.isFinite(userId)) {
    return {
      ok: false,
      code: COUPON_RESERVATION_ERRORS.DB_ERROR,
      error: "Missing userId — cannot reserve coupon redemption.",
    };
  }

  if (typeof db.transaction !== "function") {
    return runReserveStep(db, { couponId, userId });
  }

  try {
    return await db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`select id, use_type, max_uses from coupons where id = ${couponId} for update`,
      );
      const lockedRow = Array.isArray(locked)
        ? locked[0]
        : locked?.rows?.[0] ?? null;
      if (!lockedRow) {
        return {
          ok: false,
          code: COUPON_RESERVATION_ERRORS.NOT_FOUND,
          error: "Coupon not found.",
        };
      }
      return runReserveStep(tx, {
        couponId,
        userId,
        lockedUseType: lockedRow.use_type ?? lockedRow.useType,
        lockedMaxUses: lockedRow.max_uses ?? lockedRow.maxUses ?? null,
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("reserveCouponRedemption:", e);
    return {
      ok: false,
      code: COUPON_RESERVATION_ERRORS.DB_ERROR,
      error: msg,
    };
  }
}

async function runReserveStep(
  db,
  { couponId, userId, lockedUseType, lockedMaxUses },
) {
  let useType = lockedUseType;
  let maxUses = lockedMaxUses ?? null;
  if (useType == null) {
    const [coupon] = await db
      .select({ useType: coupons.useType, maxUses: coupons.maxUses })
      .from(coupons)
      .where(eq(coupons.id, couponId))
      .limit(1);
    if (!coupon) {
      return {
        ok: false,
        code: COUPON_RESERVATION_ERRORS.NOT_FOUND,
        error: "Coupon not found.",
      };
    }
    useType = coupon.useType;
    maxUses = coupon.maxUses;
  }

  if (useType === "one_time") {
    const [existing] = await db
      .select({ id: couponRedemptions.id })
      .from(couponRedemptions)
      .where(eq(couponRedemptions.couponId, couponId))
      .limit(1);
    if (existing) {
      return {
        ok: false,
        code: COUPON_RESERVATION_ERRORS.ALREADY_REDEEMED,
        error: "This coupon has already been used.",
      };
    }
  } else if (maxUses != null) {
    const [cntRow] = await db
      .select({ c: count() })
      .from(couponRedemptions)
      .where(eq(couponRedemptions.couponId, couponId));
    const cnt = Number(cntRow?.c ?? 0);
    if (cnt >= maxUses) {
      return {
        ok: false,
        code: COUPON_RESERVATION_ERRORS.LIMIT_REACHED,
        error: "Coupon redemption limit reached.",
      };
    }
  }

  const [inserted] = await db
    .insert(couponRedemptions)
    .values({
      couponId,
      userId,
      paymentIntentId: null,
    })
    .returning({ id: couponRedemptions.id });

  if (!inserted?.id) {
    return {
      ok: false,
      code: COUPON_RESERVATION_ERRORS.DB_ERROR,
      error: "Failed to reserve coupon redemption.",
    };
  }
  return { ok: true, redemptionId: inserted.id };
}

export async function finalizeCouponRedemption(
  db,
  { redemptionId, paymentIntentId },
) {
  if (!redemptionId) return { ok: true };
  try {
    await db
      .update(couponRedemptions)
      .set({ paymentIntentId: paymentIntentId ?? null })
      .where(eq(couponRedemptions.id, redemptionId));
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("finalizeCouponRedemption:", e);
    return { ok: false, error: msg };
  }
}

export async function releaseCouponRedemption(db, { redemptionId }) {
  if (!redemptionId) return { ok: true };
  try {
    await db
      .delete(couponRedemptions)
      .where(eq(couponRedemptions.id, redemptionId));
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("releaseCouponRedemption:", e);
    return { ok: false, error: msg };
  }
}

async function runRedemptionStep(
  db,
  { couponId, userId, paymentIntentId, lockedUseType, lockedMaxUses },
) {
  try {
    if (paymentIntentId) {
      const [dupPi] = await db
        .select({ id: couponRedemptions.id })
        .from(couponRedemptions)
        .where(
          and(
            eq(couponRedemptions.couponId, couponId),
            eq(couponRedemptions.paymentIntentId, paymentIntentId),
          ),
        )
        .limit(1);
      if (dupPi) return { ok: true };
    }

    let useType = lockedUseType;
    let maxUses = lockedMaxUses ?? null;
    if (useType == null) {
      const [coupon] = await db
        .select({ useType: coupons.useType, maxUses: coupons.maxUses })
        .from(coupons)
        .where(eq(coupons.id, couponId))
        .limit(1);
      if (!coupon) return { ok: false, error: "Coupon not found." };
      useType = coupon.useType;
      maxUses = coupon.maxUses;
    }

    if (useType === "one_time") {
      const [existing] = await db
        .select({ id: couponRedemptions.id })
        .from(couponRedemptions)
        .where(eq(couponRedemptions.couponId, couponId))
        .limit(1);
      if (existing) return { ok: true };
      await db.insert(couponRedemptions).values({
        couponId,
        userId,
        paymentIntentId: paymentIntentId ?? null,
      });
      return { ok: true };
    }

    const [cntRow] = await db
      .select({ c: count() })
      .from(couponRedemptions)
      .where(eq(couponRedemptions.couponId, couponId));
    const cnt = Number(cntRow?.c ?? 0);
    if (maxUses != null && cnt >= maxUses) {
      return { ok: false, error: "Coupon redemption limit reached." };
    }

    await db.insert(couponRedemptions).values({
      couponId,
      userId,
      paymentIntentId: paymentIntentId ?? null,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("recordRegistrationCouponRedemption:", e);
    return { ok: false, error: msg };
  }
}
