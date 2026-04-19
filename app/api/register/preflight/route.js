import { NextResponse } from "next/server";
import { getMinerBySlug, getTiersForMiner } from "@/lib/miners";
import { isValidHLAddress, isValidEvmAddress, isValidEmail } from "@/lib/validation";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { checkValidatorStatus, isConfirmedDeregistered } from "@/lib/validator";
import { isAnyDevTestWallet, DEV_TEST_PRICE } from "@/lib/dev-test";
import { reportError } from "@/lib/errors";

// POST /api/register/preflight
// Runs every check that /api/register runs before payment, so callers on the
// HL/EIP-712 path can block users *before* they sign a transfer they can't
// complete. The x402 path already gets this implicitly via the initial 402
// probe, but using the same endpoint there is harmless.
export async function POST(request) {
  const reqId = Math.random().toString(36).slice(2, 10);
  console.info("[REGISTRATION] POST /api/register/preflight received", { reqId });

  let body;
  try {
    body = await request.json();
  } catch {
    console.warn("[REGISTRATION][preflight] invalid JSON body", { reqId });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    minerSlug,
    hlAddress,
    accountSize,
    tierIndex,
    payoutAddress,
    email,
    hlTransferSender,
  } = body || {};

  console.info("[REGISTRATION][preflight] body parsed", {
    reqId,
    minerSlug,
    hlAddress,
    accountSize,
    tierIndex,
    payoutAddress,
    hasEmail: Boolean(email),
    hlTransferSender,
  });

  if (!minerSlug || !hlAddress || !accountSize || tierIndex == null) {
    console.warn("[REGISTRATION][preflight] missing required fields", { reqId, minerSlug, hlAddress, accountSize, tierIndex });
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (email && !isValidEmail(email)) {
    console.warn("[REGISTRATION][preflight] invalid email", { reqId });
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (!isValidHLAddress(hlAddress)) {
    console.warn("[REGISTRATION][preflight] invalid HL address", { reqId, hlAddress });
    return NextResponse.json({ error: "Invalid HL address" }, { status: 400 });
  }

  if (payoutAddress && !isValidEvmAddress(payoutAddress)) {
    console.warn("[REGISTRATION][preflight] invalid payout address", { reqId, payoutAddress });
    return NextResponse.json({ error: "Invalid payout address" }, { status: 400 });
  }

  const miner = await getMinerBySlug(minerSlug);
  if (!miner) {
    console.warn("[REGISTRATION][preflight] unknown miner", { reqId, minerSlug });
    return NextResponse.json({ error: "Unknown miner" }, { status: 400 });
  }

  const minerTiers = await getTiersForMiner(miner.hotkey);
  const activeTiers = minerTiers.filter((t) => t.isActive);

  if (tierIndex < 0 || tierIndex >= activeTiers.length) {
    console.warn("[REGISTRATION][preflight] tier index out of range", { reqId, tierIndex, activeTiersLength: activeTiers.length });
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const tier = activeTiers[tierIndex];

  if (accountSize !== tier.accountSize) {
    console.warn("[REGISTRATION][preflight] account size mismatch", {
      reqId,
      accountSize,
      tierAccountSize: tier.accountSize,
    });
    return NextResponse.json(
      { error: "Account size does not match selected tier" },
      { status: 400 },
    );
  }

  // Duplicate check — same logic as /api/register, including validator sync
  try {
    const [existing] = await db
      .select({ id: registrations.id, status: registrations.status })
      .from(registrations)
      .where(
        and(
          eq(registrations.minerHotkey, miner.hotkey),
          eq(registrations.hlAddress, hlAddress),
          inArray(registrations.status, ["registered", "pending"]),
        ),
      )
      .limit(1);

    if (existing) {
      console.info("[REGISTRATION][preflight] existing registration found", {
        reqId,
        existingId: existing.id,
        existingStatus: existing.status,
      });
      if (existing.status === "registered") {
        const validatorStatus = await checkValidatorStatus(hlAddress);
        console.info("[REGISTRATION][preflight] validator status check", {
          reqId,
          hlAddress,
          validatorStatus: validatorStatus.status,
        });
        if (!isConfirmedDeregistered(validatorStatus.status)) {
          console.warn("[REGISTRATION][preflight] blocked — already registered and active", { reqId, hlAddress });
          return NextResponse.json(
            { error: "This HL address is already registered with this miner." },
            { status: 409 },
          );
        }
        // Confirmed de-registered — /api/register will sync the DB row on the
        // real submission. Preflight just signals "ok to proceed".
      } else {
        console.warn("[REGISTRATION][preflight] blocked — pending registration exists", { reqId, hlAddress });
        return NextResponse.json(
          {
            error:
              "A registration for this HL address is already being processed. Please wait for it to complete.",
          },
          { status: 409 },
        );
      }
    }
  } catch (err) {
    console.error("[REGISTRATION][preflight] duplicate check failed", { reqId, error: err.message });
    reportError(err, {
      source: "api/register/preflight",
      metadata: { step: "duplicate_check", reqId, minerSlug, hlAddress },
    });
    // Fall through — better to let the user try than block on a transient DB error.
  }

  const price = Number(tier.priceUsdc);
  const devTest = isAnyDevTestWallet(hlAddress, hlTransferSender);
  const effectivePrice = devTest ? DEV_TEST_PRICE : price;

  console.info("[REGISTRATION][preflight] ok", { reqId, price, effectivePrice, devTest });

  return NextResponse.json({
    ok: true,
    price,
    effectivePrice,
    devTest,
  });
}
