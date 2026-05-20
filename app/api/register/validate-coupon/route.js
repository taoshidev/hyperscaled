import { NextResponse } from "next/server";
import { getMinerBySlug, getTiersForMiner } from "@/lib/miners";
import { isValidHLAddress, isValidEmail } from "@/lib/validation";
import { getDb } from "@/lib/db";
import { evaluateRegistrationPricing } from "@/lib/registration-pricing";
import { checkRateLimit, getTrustedClientId } from "@/lib/rate-limit";

const PLACEHOLDER_HL_FOR_PRICING = "0x0000000000000000000000000000000000000000";

const VALIDATE_COUPON_LIMIT = 30;
const VALIDATE_COUPON_WINDOW_MS = 60_000;

export async function POST(request) {
  const trustedIp = getTrustedClientId(request);
  const limiterKey = trustedIp
    ? `validate-coupon:ip:${trustedIp}`
    : "validate-coupon:unknown";
  const rl = await checkRateLimit({
    key: limiterKey,
    limit: VALIDATE_COUPON_LIMIT,
    windowMs: VALIDATE_COUPON_WINDOW_MS,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000) || 1),
        },
      },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const {
    minerSlug,
    hlAddress,
    accountSize,
    tierIndex,
    hlTransferSender,
    email,
    couponCode,
  } = body || {};

  if (!minerSlug || tierIndex == null) {
    return NextResponse.json(
      { ok: false, error: "Missing miner or tier selection." },
      { status: 400 },
    );
  }

  if (
    hlAddress != null &&
    String(hlAddress).trim().length > 0 &&
    !isValidHLAddress(String(hlAddress))
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid HL address format." },
      { status: 400 },
    );
  }

  if (
    email !== undefined &&
    email !== null &&
    email !== "" &&
    !isValidEmail(String(email))
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid email address format." },
      { status: 400 },
    );
  }

  const miner = await getMinerBySlug(minerSlug);
  if (!miner) {
    return NextResponse.json({ ok: false, error: "Unknown miner." }, { status: 400 });
  }

  const minerTiers = await getTiersForMiner(miner.hotkey);
  const activeTiers = minerTiers.filter((t) => t.isActive);

  if (tierIndex < 0 || tierIndex >= activeTiers.length) {
    return NextResponse.json({ ok: false, error: "Invalid tier." }, { status: 400 });
  }

  const tier = activeTiers[tierIndex];

  if (
    accountSize != null &&
    Number(accountSize) !== Number(tier.accountSize)
  ) {
    return NextResponse.json(
      { ok: false, error: "Account size does not match tier." },
      { status: 400 },
    );
  }

  const resolvedHl =
    hlAddress && String(hlAddress).trim().length > 0
      ? String(hlAddress).trim().toLowerCase()
      : PLACEHOLDER_HL_FOR_PRICING;

  const rawCouponArg =
    typeof couponCode === "string" ? couponCode.trim().toUpperCase() : "";

  try {
    const db = await getDb();
    const pricing = await evaluateRegistrationPricing(
      db,
      miner,
      tier,
      resolvedHl,
      hlTransferSender ?? undefined,
      email ?? "",
      rawCouponArg || undefined,
    );

    if (!pricing.ok) {
      return NextResponse.json(
        {
          ok: false,
          valid: false,
          error: pricing.error,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      valid: pricing.couponMeta != null ? true : rawCouponArg.length === 0,
      tierListPrice: pricing.tierListPrice,
      baseAfterWallet: pricing.baseAfterDev,
      effectivePrice: pricing.effectivePrice,
      discountAmount: pricing.discountAmount,
      couponApplied: Boolean(pricing.couponMeta),
      devTest: pricing.devTest,
      tierSlug: pricing.tierSlug,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not evaluate coupon." },
      { status: 500 },
    );
  }
}
