import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users, registrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isValidEvmAddress, isValidEmail } from "@/lib/validation";

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function authenticate(request) {
  const apiKey = process.env.VANTA_SYNC_API_KEY;
  if (!apiKey) {
    return { error: "VANTA_SYNC_API_KEY not configured", status: 500 };
  }

  const auth = request.headers.get("authorization");
  const token = auth?.replace(/^Bearer\s+/i, "") || "";
  if (!timingSafeEqual(apiKey, token)) {
    return { error: "Unauthorized", status: 401 };
  }

  return null;
}

const VALID_KYC_STATUSES = ["none", "pending", "approved", "rejected"];

async function handleSyncRegistration(body) {
  const {
    email,
    hlAddress,
    payoutAddress,
    accountSize,
    tierIndex,
    priceUsdc,
    txHash,
    paymentMethod,
    minerHotkey,
    registrationStatus,
  } = body;

  // --- Validate required fields ---
  if (!hlAddress || !accountSize || tierIndex == null || !priceUsdc || !txHash || !minerHotkey) {
    return NextResponse.json(
      { error: "Missing required fields: hlAddress, accountSize, tierIndex, priceUsdc, txHash, minerHotkey" },
      { status: 400 },
    );
  }

  if (!isValidEvmAddress(hlAddress)) {
    return NextResponse.json({ error: "Invalid hlAddress format" }, { status: 400 });
  }

  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const wallet = hlAddress.toLowerCase();
  const finalPayoutAddress = (payoutAddress || hlAddress).toLowerCase();

  try {
    // --- Upsert user ---
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.wallet, wallet))
      .limit(1);

    let userId;

    if (existingUser) {
      userId = existingUser.id;
      if (email && email !== existingUser.email) {
        await db
          .update(users)
          .set({ email, updatedAt: new Date() })
          .where(eq(users.id, existingUser.id));
      }
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          wallet,
          email: email || null,
          kycStatus: "none",
        })
        .returning({ id: users.id });
      userId = newUser.id;
    }

    // --- Insert registration ---
    const [newRegistration] = await db
      .insert(registrations)
      .values({
        userId,
        minerHotkey,
        hlAddress: wallet,
        accountSize,
        payoutAddress: finalPayoutAddress,
        tierIndex,
        priceUsdc: String(priceUsdc),
        txHash,
        status: registrationStatus || "pending",
        statusDetail: {
          source: "vanta",
          paymentMethod: paymentMethod || "unknown",
        },
      })
      .returning({ id: registrations.id });

    console.info(
      `[vanta-sync] sync_registration: userId=${userId} registrationId=${newRegistration.id} wallet=${wallet} txHash=${txHash}`,
    );

    return NextResponse.json({
      success: true,
      userId,
      registrationId: newRegistration.id,
    });
  } catch (err) {
    // Handle duplicate txHash (unique constraint violation)
    if (err.code === "23505" && err.constraint?.includes("tx_hash")) {
      console.error(`[vanta-sync] sync_registration: duplicate txHash=${txHash}`);
      return NextResponse.json(
        { error: "Registration with this txHash already exists", txHash },
        { status: 409 },
      );
    }

    console.error("[vanta-sync] sync_registration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleSyncKyc(body) {
  const { wallet, kycStatus, kycApplicantId, kycVerifiedAt } = body;

  if (!wallet || !kycStatus) {
    return NextResponse.json(
      { error: "Missing required fields: wallet, kycStatus" },
      { status: 400 },
    );
  }

  if (!isValidEvmAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 });
  }

  if (!VALID_KYC_STATUSES.includes(kycStatus)) {
    return NextResponse.json(
      { error: `Invalid kycStatus. Must be one of: ${VALID_KYC_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const normalizedWallet = wallet.toLowerCase();

  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.wallet, normalizedWallet))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found", wallet: normalizedWallet },
        { status: 404 },
      );
    }

    const updateData = {
      kycStatus,
      updatedAt: new Date(),
    };

    if (kycApplicantId !== undefined) {
      updateData.kycApplicantId = kycApplicantId;
    }

    if (kycVerifiedAt !== undefined) {
      updateData.kycVerifiedAt = new Date(kycVerifiedAt);
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, existingUser.id));

    console.info(
      `[vanta-sync] sync_kyc: wallet=${normalizedWallet} kycStatus=${kycStatus}`,
    );

    return NextResponse.json({
      success: true,
      wallet: normalizedWallet,
    });
  } catch (err) {
    console.error("[vanta-sync] sync_kyc error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const authError = authenticate(request);
  if (authError) {
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body;

  switch (action) {
    case "sync_registration":
      return handleSyncRegistration(body);
    case "sync_kyc":
      return handleSyncKyc(body);
    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}. Supported actions: sync_registration, sync_kyc` },
        { status: 400 },
      );
  }
}
