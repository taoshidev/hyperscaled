import { NextResponse } from "next/server";
import { getMinerBySlug, getTiersForMiner } from "@/lib/miners";
import { isValidHLAddress, isValidEvmAddress, isValidEmail } from "@/lib/validation";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { checkValidatorStatus, isConfirmedDeregistered } from "@/lib/validator";
import { isAnyDevTestWallet, DEV_TEST_PRICE } from "@/lib/dev-test";

// POST /api/register/preflight
// Runs every check that /api/register runs before payment, so callers on the
// HL/EIP-712 path can block users *before* they sign a transfer they can't
// complete. The x402 path already gets this implicitly via the initial 402
// probe, but using the same endpoint there is harmless.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
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

  if (!minerSlug || !hlAddress || !accountSize || tierIndex == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (!isValidHLAddress(hlAddress)) {
    return NextResponse.json({ error: "Invalid HL address" }, { status: 400 });
  }

  if (payoutAddress && !isValidEvmAddress(payoutAddress)) {
    return NextResponse.json({ error: "Invalid payout address" }, { status: 400 });
  }

  const miner = await getMinerBySlug(minerSlug);
  if (!miner) {
    return NextResponse.json({ error: "Unknown miner" }, { status: 400 });
  }

  const minerTiers = await getTiersForMiner(miner.hotkey);
  const activeTiers = minerTiers.filter((t) => t.isActive);

  if (tierIndex < 0 || tierIndex >= activeTiers.length) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const tier = activeTiers[tierIndex];

  if (accountSize !== tier.accountSize) {
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
      if (existing.status === "registered") {
        const validatorStatus = await checkValidatorStatus(hlAddress);
        if (!isConfirmedDeregistered(validatorStatus.status)) {
          return NextResponse.json(
            { error: "This HL address is already registered with this miner." },
            { status: 409 },
          );
        }
        // Confirmed de-registered — /api/register will sync the DB row on the
        // real submission. Preflight just signals "ok to proceed".
      } else {
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
    console.error("[preflight] Duplicate check failed:", err.message);
    // Fall through — better to let the user try than block on a transient DB error.
  }

  const price = Number(tier.priceUsdc);
  const devTest = isAnyDevTestWallet(hlAddress, hlTransferSender);
  const effectivePrice = devTest ? DEV_TEST_PRICE : price;

  return NextResponse.json({
    ok: true,
    price,
    effectivePrice,
    devTest,
  });
}
