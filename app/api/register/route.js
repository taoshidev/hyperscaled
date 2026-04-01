import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getMinerBySlug, getTiersForMiner } from "@/lib/miners";
import { isValidHLAddress, isValidEmail } from "@/lib/validation";
import { db } from "@/lib/db";
import { users, registrations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { checkValidatorStatus, isConfirmedDeregistered } from "@/lib/validator";

const MINER_SLUG = "vanta";

function sanitizeApiKey(key) {
  if (key == null) return null;
  const t = String(key).trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  return t || null;
}

function resolveMinerApiKey(miner) {
  const fromDb = sanitizeApiKey(miner.apiKey);
  if (fromDb) return fromDb;
  const slugEnv = `ENTITY_MINER_API_KEY_${miner.slug.replace(/-/g, "_").toUpperCase()}`;
  return sanitizeApiKey(process.env[slugEnv]) || sanitizeApiKey(process.env.ENTITY_MINER_API_KEY) || null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { hlAddress, email, accountSize, tierIndex } = body;

  if (!hlAddress || !email || !accountSize || tierIndex == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isValidHLAddress(hlAddress)) {
    return NextResponse.json({ error: "Invalid HL address" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  let miner;
  try {
    miner = await getMinerBySlug(MINER_SLUG);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/testnet-register", step: "get_miner" } });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (!miner) {
    return NextResponse.json({ error: "Testnet registration is not available" }, { status: 503 });
  }

  let activeTiers;
  try {
    const minerTiers = await getTiersForMiner(miner.hotkey);
    activeTiers = minerTiers.filter((t) => t.isActive);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/testnet-register", step: "get_tiers" } });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (tierIndex < 0 || tierIndex >= activeTiers.length) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const tier = activeTiers[tierIndex];
  if (tier.accountSize !== accountSize) {
    return NextResponse.json({ error: "Account size mismatch" }, { status: 400 });
  }

  // Reject duplicate registrations
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
      // For both "registered" and "pending" on testnet (no payment risk), check the
      // validator before blocking — the user may have been de-registered externally.
      const validatorStatus = await checkValidatorStatus(hlAddress);
      if (isConfirmedDeregistered(validatorStatus.status)) {
        await db
          .update(registrations)
          .set({
            status: "deregistered",
            statusDetail: {
              deregisteredAt: new Date().toISOString(),
              validatorStatus: validatorStatus.status,
            },
            updatedAt: new Date(),
          })
          .where(eq(registrations.id, existing.id));
        console.info("[testnet-register] De-registration detected — DB synced, allowing re-registration", {
          hlAddress,
          validatorStatus: validatorStatus.status,
        });
        // Fall through — allow the registration to proceed
      } else {
        const msg =
          existing.status === "registered"
            ? "This HL address is already registered."
            : "A registration for this address is already being processed.";
        return NextResponse.json({ error: msg }, { status: 409 });
      }
    }
  } catch (err) {
    console.error("[testnet-register] Duplicate check failed:", err.message);
  }

  // Call miner API to provision the HL subaccount
  let registered = false;
  let statusDetail = null;

  if (miner.apiUrl) {
    try {
      const apiKey = resolveMinerApiKey(miner);
      const baseUrl = miner.apiUrl.replace(/\/+$/, "");
      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(`${baseUrl}/api/create-hl-subaccount`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          hl_address: hlAddress,
          account_size: accountSize,
          payout_address: hlAddress,
        }),
      });

      if (res.ok) {
        registered = true;
      } else {
        const errText = await res.text().catch(() => "");
        console.error("[testnet-register] Miner API error:", res.status, errText);
        statusDetail = { reason: "miner_api_error", apiStatus: res.status };
      }
    } catch (err) {
      console.error("[testnet-register] Miner API unreachable:", err.message);
      statusDetail = { reason: "miner_api_unreachable", error: err.message };
    }
  }

  // Upsert user record
  let userId = null;
  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.wallet, hlAddress))
      .limit(1);

    if (existing) {
      userId = existing.id;
      if (email && email !== existing.email) {
        await db.update(users).set({ email, updatedAt: new Date() }).where(eq(users.id, existing.id));
      }
    } else {
      const [newUser] = await db
        .insert(users)
        .values({ wallet: hlAddress, email })
        .returning({ id: users.id });
      userId = newUser.id;
    }
  } catch (err) {
    console.error("[testnet-register] User upsert failed:", err.message);
  }

  // Insert registration record
  try {
    await db.insert(registrations).values({
      userId,
      minerHotkey: miner.hotkey,
      hlAddress,
      accountSize,
      payoutAddress: hlAddress,
      tierIndex,
      priceUsdc: "0.00",
      txHash: null,
      status: registered ? "registered" : "pending",
      statusDetail: {
        paymentMethod: "testnet",
        ...(statusDetail || {}),
      },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/testnet-register", step: "registration_insert" } });
    console.error("[testnet-register] Registration insert failed:", err.message);
    return NextResponse.json(
      { error: "Registration could not be saved. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    status: registered ? "registered" : "pending",
    message: registered
      ? "Your testnet account has been created."
      : "Your registration is being processed. We'll follow up via email.",
  });
}
